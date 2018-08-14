// https://nodejs.org/api/readline.html
import { ReadLine, createInterface, clearLine, cursorTo } from 'readline';
// https://www.npmjs.com/package/colors
import * as colors from 'colors/safe';
import { CardAction, Message, HeroCard, Thumbnail, Signin, Attachment } from 'botframework-directlinejs';

export class ConsoleInterface {
    private readLine: ReadLine;
    private botPrompt: string;

    constructor(botPrompt: string, userPrompt: string) {
        this.readLine = createInterface(process.stdin, process.stdout);
        this.readLine.setPrompt(colors.bold(colors.yellow(`${userPrompt}> `)));
        this.readLine.on('close', () => process.exit(0));
        this.botPrompt = colors.bold(colors.cyan(`${botPrompt}> `));
    }

    public onUserMessage(listener: (input: string) => void) {
        this.readLine.on('line', listener);
    }

    public close() {
        this.readLine.close();
    }

    public promptUser() {
        this.readLine.prompt();
    }

    public jumpLine() {
        console.log();
    }

    public showInfo(text: string) {
        this.clearUserPrompt();
        console.log(text);
    }

    public showError(text: string) {
        this.clearUserPrompt();
        console.log(colors.red(text));
    }

    public showMessage(message: Message) {
        this.clearUserPrompt();

        if (message.text) {
            this.showText(message.text);
        }

        if (message.attachments) {
            this.showAttachments(message.attachments);
        }

        if (message.suggestedActions && message.suggestedActions.actions) {
            this.showSuggestedActions(message.suggestedActions.actions);
        }
    }

    private showText(text: string) {
        console.log(`${this.botPrompt}${colors.cyan(text)}`);
    }

    private showSuggestedActions(actions: CardAction[]) {
        const text = actions
            .map(action => colors.inverse(colors.cyan(action.value)))
            .reduceRight((actions, action) => `${action} ${actions}`, '');
        console.group();
        console.log(`${colors.bold(colors.cyan('Suggestions:'))} ${text}`);
        console.groupEnd();
    }

    private showAttachments(attachments: Attachment[]) {
        console.log();
        attachments
            .forEach(attachment => {
                console.group();
                switch (attachment.contentType) {
                    case 'application/vnd.microsoft.card.hero':
                        this.showCard(attachment as HeroCard);
                        break;
                    case 'application/vnd.microsoft.card.thumbnail':
                        this.showCard(attachment as Thumbnail);
                        break;
                    case 'application/vnd.microsoft.card.signin':
                        this.showCard(attachment as Signin);
                        break;
                    default:
                        this.showError(`Attachment of type ${attachment.contentType} is not supported`);
                }

                console.groupEnd();
                console.log();
            });
    }

    private showCard(card: HeroCard | Thumbnail | Signin) {
        const title = (card.content as any).title;
        if (title) {
            console.log(colors.underline(colors.bold(colors.cyan(title))));
        }

        const subtitle = (card.content as any).subtitle;
        if (subtitle) {
            console.log(colors.bold(colors.cyan(subtitle)));
        }

        if (card.content.text) {
            console.log(colors.cyan(card.content.text));
        }

        if (card.content.buttons) {
            this.showButtons(card.content.buttons);
        }
    }

    private showButtons(actions: CardAction[]) {
        const text = actions
            .map(action => `${colors.bold(colors.cyan(action.title))}${colors.cyan('-->')}${colors.inverse(colors.cyan(action.value))}`)
            .reduceRight((actions, action) => `${action} ${actions}`, '');
        console.log(text);
    }

    private clearUserPrompt() {
        cursorTo(process.stdout, 0);
        clearLine(process.stdout, 0);
    }
}