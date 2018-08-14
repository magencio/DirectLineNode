import axios from 'axios';

// Generate a DirectLine token
// https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-authentication?view=azure-bot-service-3.0#generate-token
export async function generateToken(secret: string) : Promise<any> {
    return callDirectLineApi('post', 'tokens/generate', secret);
}

// Refresh a Direct Line token
// https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-authentication?view=azure-bot-service-3.0#refresh-token
export async function refreshToken(token: string) : Promise<any> {
    return callDirectLineApi('post', 'tokens/refresh', token);
}

// Reconnect Direct Line to conversation
// https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-reconnect-to-conversation?view=azure-bot-service-3.0
export async function reconnectToConversation(conversationId: string, token: string) {
    return callDirectLineApi('get', `conversations/${conversationId}`, token);
}

async function callDirectLineApi(method: string, api: string, secretOrToken: string) : Promise<any> {
    const result = await axios({
        method: method,
        baseURL: 'https://directline.botframework.com/v3/directline',
        url: api,
        headers: {
            'Authorization': `Bearer ${secretOrToken}`
        }
    });
    return result.data;
}