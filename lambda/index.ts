import { IncomingWebhook } from '@slack/webhook';
import { getSecret, createSlackBlocksSimple } from './utils';
import { SNSEvent, Context } from 'aws-lambda';

export const handler = async (event: SNSEvent, context: Context): Promise<void> => {
  console.log(`event -> ${JSON.stringify(event)}`);
  console.log(`context -> ${JSON.stringify(context)}`);
  console.log(`process.env.SECRET_NAME -> ${process.env.SECRET_NAME}`);

  const secret = JSON.parse(await getSecret(process.env.SECRET_NAME!, process.env.AWS_SESSION_TOKEN!));
  if (!secret) throw new Error('secret is empty cannot continue'); // triggered when configured secret has no value

  const message = JSON.parse(event.Records[0].Sns.Message);
  console.log(`message -> ${JSON.stringify(message)}`);

  const blocks = await createSlackBlocksSimple(message);
  console.log(`blocks -> ${JSON.stringify(blocks)}`);

  console.log('Send the notification');
  const webhook = new IncomingWebhook(`https://hooks.slack.com/services/${secret.Workspace}/${secret.Channel}/${secret.Webhook}`);

  await webhook.send({
    blocks: blocks,
  });
};
