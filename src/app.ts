import { config }  from './config';
import { ConsoleInterface } from './consoleInterface';
import { XMLHttpRequest } from 'xhr2';
import * as WebSocket from 'ws';
import { DirectLine, ConnectionStatus, Message, HeroCard } from 'botframework-directlinejs';
import { generateToken, refreshToken, reconnectToConversation } from './directLine';
import { debug } from 'util';

// Read configuration
const botId = config.get('BotId');
const user = { id: config.get('UserId'), name: config.get('UserName') };
const directLineKey = config.get('DirectLineKey');

// Create a basic text based interface to talk to the bot
const console = new ConsoleInterface(botId, user.id);

// Required for BotFramework-DirectLineJS to work in Nodejs
global[`XMLHttpRequest`] = XMLHttpRequest;
global[`WebSocket`] = WebSocket;

// Get DirectLine token
generateToken(directLineKey).then(result => {

    // Connect to bot
    // https://github.com/Microsoft/BotFramework-DirectLineJS
    const directLine = new DirectLine({
        token: result.token,
        webSocket: true
    });

    // Deal with connection status changes
    directLine.connectionStatus$
        .subscribe(async connectionStatus => {
            switch (connectionStatus) {
                case ConnectionStatus.Uninitialized:    // the status when the DirectLine object is first created/constructed
                    console.showInfo('Connection Status: Uninitialized');
                    break;
                case ConnectionStatus.Connecting:       // currently trying to connect to the conversation
                    console.showInfo('Connection Status: Connecting');
                    break;
                case ConnectionStatus.Online:           // successfully connected to the conversation. Connection is healthy so far as we know.
                    console.showInfo('Connection Status: Online');
                    console.jumpLine();
                    // DirectLine sends a conversationUpdate activity when the bot is added to the conversation and when each user posts a message
                    // to the conversation for the first time. So I'm sending an event at the very beginning to force the conversationUpdate activity for
                    // the user, so the bot says a welcome message to that user before she types anything.
                    directLine.postActivity({
                        from: user,
                        type: 'event',
                        name: 'conversationUpdate',
                        value: ''
                    }).subscribe(null, error => console.showError(`Error posting activity${error}`));
                    break;
                case ConnectionStatus.ExpiredToken:     // last operation errored out with an expired token. Your app should supply a new one.
                    console.showInfo('Connection Status: Expired Token');
                    result = await refreshToken(result.token);
                    const conversation = await reconnectToConversation((directLine as any).conversationId, result.token);
                    directLine.reconnect(conversation);
                    break;
                case ConnectionStatus.FailedToConnect:  // the initial attempt to connect to the conversation failed. No recovery possible.
                    console.showError('Connection Status: Failed To Connect');
                    console.close();
                    break;
                case ConnectionStatus.Ended:            // the bot ended the conversation
                    console.showError('Connection Status: Ended');
                    console.close();
                    break;
            }
        });

    // Send messages from the user to the bot
    console.onUserMessage(text =>
        directLine
            .postActivity({ from: user, type: 'message', text: text })
            .subscribe(null, error => console.showError(`Error posting activity${error}`))
    );

    // Show messages from the bot to the user
    directLine.activity$
        .filter(activity => activity.type === 'message' && activity.from.id === botId)
        .map(activity => activity as Message)
        .subscribe(message => {
            console.showMessage(message);
            console.promptUser();
        });

    // Capture handoff messages from the bot
    directLine.activity$
        .filter(activity => activity.type.toString() === 'handoff' && activity.from.id === botId)
        .subscribe(handoff => {
            console.showInfo(`Handoff data: ${JSON.stringify(handoff.channelData)}`);
            console.showInfo(`Conversation transcript: ${JSON.stringify((handoff as any).transcript)}`);
            console.promptUser();
        });
});