# sns-to-slack-webhook

AWS CDK construct that forwards Amazon SNS messages to Slack via Incoming Webhooks.

> Turn any SNS topic into Slack alerts. The construct wires up a Lambda to your topic and posts structured messages to Slack (Block Kit).

---

## Features

* **Drop‑in CDK v2 construct** – bring your own `sns.ITopic`.
* **Ready‑to‑deploy Lambda** (Node.js 22.x) bundled automatically by `NodejsFunction`.
* **Secrets Manager integration** – Slack webhook parts are read securely at runtime.
* **Minimal config** – sensible defaults for description and log retention.

---

## Installation

```bash
npm i sns-to-slack
# peer deps (most CDK projects already have these):
npm i aws-cdk-lib constructs
```

> This library declares `aws-cdk-lib` and `constructs` as **peerDependencies**.

---

## Quick start

```ts
import { Stack } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import { SnsToSlack } from 'sns-to-slack-webhook';

export class ExampleStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const topic = new sns.Topic(this, 'ExampleTopic', {
      displayName: 'example-topic',
      topicName: 'example-topic',
    });

    new SnsToSlack(this, 'SnsToSlack', {
      snsTopic: topic,
      // optional overrides
      // secretName: 'slack/webhook',
      // description: 'SNS to Slack Webhook',
      // logRetentionDays: 30,
    });
  }
}
```

Publish any JSON message to the topic — the Lambda will format it and deliver to Slack.

---

## Slack & secret setup

The Lambda expects the Slack **Incoming Webhook** to be provided via **AWS Secrets Manager**.

* **Secret name**: defaults to `slack/webhook` (override with the `secretName` prop).
* **Secret value (JSON)** must contain the three parts of a Slack webhook URL:

```json
{
  "Workspace": "T12345678",
  "Channel": "B23456789",
  "Webhook": "xYzABC123..."
}
```

These map to a full Slack URL of the form:

```
https://hooks.slack.com/services/<Workspace>/<Channel>/<Webhook>
```

Create the secret (example):

```bash
aws secretsmanager create-secret \
  --name slack/webhook \
  --secret-string '{"Workspace":"T12345678","Channel":"B23456789","Webhook":"xYzABC123"}'
```

> You need a Slack app with **Incoming Webhooks** enabled. Paste the generated webhook URL and split its path segments into the fields above.

---

\$1

### Required & optional

* **Required**

  * `snsTopic` (`sns.ITopic`): SNS topic to subscribe the Lambda to.
* **Optional**

  * `secretName` (`string`, default: **`"slack/webhook"`**): Name of the AWS Secrets Manager secret with Slack webhook parts (`Workspace`, `Channel`, `Webhook`).
  * `description` (`string`, default: **`"SNS to Slack Webhook"`**): Description assigned to the Lambda function.
  * `logRetentionDays` (`number`, default: **`30`**): CloudWatch Logs retention in days.

### Props summary

| Prop               | Type         | Required | Default           | Description                                       |
| ------------------ | ------------ | -------- | ----------------- | ------------------------------------------------- |
| `snsTopic`         | `sns.ITopic` | Yes      | —                 | Topic the Lambda subscribes to.                   |
| `secretName`       | `string`     | No       | `"slack/webhook"` | Secrets Manager name holding Slack webhook parts. |
| `description`      | `string`     | No       | `"SNS to Slack Webhook"`  | Lambda description.                               |
| `logRetentionDays` | `number`     | No       | `30`              | CloudWatch Logs retention days.                   |

### Runtime defaults (created resources)

* **Lambda runtime**: Node.js **22.x**
* **Architecture**: **ARM64**
* **Timeout**: **10 seconds**
* **Bundling**: `minify: true`, `sourceMap: true`
* **Environment**: `SECRET_NAME=<your secret name>`, `NODE_ENV=production`
* **Subscription**: Lambda is subscribed to the topic with protocol **LAMBDA**

---

## What the construct creates

* A **Lambda function** (Node.js 22.x, ARM64) with source bundled from this package’s `lambda/` folder.
* **Subscription** of the Lambda to the provided SNS topic.
* **Permissions**:

  * `secretsmanager:GetSecretValue` for the configured secret.
  * Allow **SNS** to invoke the Lambda.
* **Environment**: `SECRET_NAME=<your secret name>`; optional logging retention.

---

## Message format in Slack

Messages are posted using Slack **Block Kit** (simple summary layout). You can fork and customize `lambda/utils.ts` if you need richer formatting.

---

## Troubleshooting

**TS2322: Type 'Topic' is not assignable to type 'ITopic'**
Make sure you pass an **`sns.ITopic`** (e.g., `new sns.Topic(...)` satisfies that) and that your project has a single installation of `aws-cdk-lib` (this library lists CDK as a `peerDependency`).

**ValidationError: Cannot find entry file at ./lambda/index.ts**
Use the published package from npm. The construct resolves its Lambda entry internally; you shouldn’t need to set `entry` yourself.

---

## Development (optional)

* This package is written in TypeScript and targets CDK v2.
* Build: `npm run build`
* Lint: `npm run lint`
* The Lambda code lives under `lambda/` and is bundled by `NodejsFunction`.

---

## License

MIT
See **LICENSE** for details.

---

## Links

* AWS CDK: [https://github.com/aws/aws-cdk](https://github.com/aws/aws-cdk)
* Slack Incoming Webhooks: [https://api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks)
* Construct Hub listing: [https://constructs.dev/npm/package/sns-to-slack-webhook](https://constructs.dev/npm/package/sns-to-slack)
