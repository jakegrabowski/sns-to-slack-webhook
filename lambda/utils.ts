import axios from 'axios';

/**
 * Reads secret via secret cache layer service
 * @param secretName name of the secret in sercret manager
 * @param token session access token
 * @returns
 */
export async function getSecret(secretName: string, token: string): Promise<string> {
    try {
      const response = await axios.get(
        `/secretsmanager/get?secretId=${secretName}`,
        {
          baseURL: 'http://localhost:2773',
          headers: {
            'X-Aws-Parameters-Secrets-Token': token,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.SecretString;
    } catch (exception) {
      console.error(`grabbing secret -> ${exception}`);
      throw exception;
    }
  }

interface SnsMessage {
  detail: { [key: string]: any };
  resources: string[];
  additionalAttributes: {
    failedActions: { additionalInformation: string }[];
  };
}

export async function createSlackBlocksSimple(message: SnsMessage): Promise<any[]> {
  return [{
    "type": "context",
    "elements": [{
      "type": "plain_text",
      "text": `:x: ${message.resources[0]}`,
      "emoji": true
    }]
  }];
}

export async function createSlackBlocksRich(message: SnsMessage): Promise<any[]> {
  const blocks = [];

  const header = {
    "type": "header",
    "text": {
      "type": "plain_text",
      "text": ":x: Skywave Build Failed",
      "emoji": true
    }
  };

  const details = {
    "type": "section",
    "fields": Array<{ type: string, text: string }>()
  }

  for (const key in message.detail) {
    details.fields.push({
      "type": "mrkdwn",
      "text": `*${key}:*\n${message.detail[key]}`
    });
  }

  let resourcesList = "";
  for (const resource of message.resources) {
    resourcesList += `${resource}\n`;
  }

  const resources = {
    "type": "context",
    "elements": [
      {
        "type": "mrkdwn",
        "text": `*resources*:\n${resourcesList}`
      }
    ]
  }

  let failedActionsList = "";
  let failedActions = {};
  if (message.additionalAttributes.failedActions) {
    for (const failedAction of message.additionalAttributes.failedActions) {
      failedActionsList += `${failedAction.additionalInformation}\n`;
    }

    failedActions = {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": `*failedActions*:\n${failedActionsList}`
        }
      ]
    }
  }

  blocks.push(header);
  blocks.push(details);
  blocks.push(resources);
  if (message.additionalAttributes.failedActions) blocks.push(failedActions);
  blocks.push({
    "type": "input",
    "element": {
      "type": "checkboxes",
      "options": [
        {
          "text": {
            "type": "plain_text",
            "text": "*Viewed*",
            "emoji": true
          },
          "value": "value-0"
        }
      ]
    },
    "label": {
      "type": "plain_text",
      "text": "Viewed",
      "emoji": true
    }
  });

  return blocks;
}
