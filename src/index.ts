import * as sns from 'aws-cdk-lib/aws-sns';
import {Construct} from "constructs";
import {Secret} from 'aws-cdk-lib/aws-secretsmanager';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {Runtime, Architecture} from 'aws-cdk-lib/aws-lambda';
import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {ParamsAndSecretsLayerVersion, ParamsAndSecretsVersions, ParamsAndSecretsLogLevel} from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export interface SnsToSlackWebhookProps {
    readonly snsTopic: sns.ITopic;
    readonly secretName?: string;
    readonly description?: string;
    readonly logRetentionDays?: number;
}

export class SnsToSlackWebhook extends Construct {
    constructor(scope: Construct, id: string, props: SnsToSlackWebhookProps) {
        super(scope, id);

        const snsToSlackSecret = Secret.fromSecretNameV2(
            this, 'snsToSlackSecret', props.secretName ?? 'slack/webhook'
        );

        const snsToSlackFn = new NodejsFunction(this, 'snsToSlackFn', {
            runtime: Runtime.NODEJS_22_X,
            architecture: Architecture.ARM_64,
            bundling: {
                minify: true,
                sourceMap: true,
            },
            handler: 'index.handler',
            entry: path.join(__dirname, '..', 'lambda', 'index.ts'),
            logRetention: props.logRetentionDays ?? 30,
            timeout: Duration.seconds(10),
            description: props.description ?? 'SNS to Slack Webhook',
            reservedConcurrentExecutions: 5,
            paramsAndSecrets: ParamsAndSecretsLayerVersion.fromVersion(
                ParamsAndSecretsVersions.V1_0_103,
                {
                    secretsManagerTtl: Duration.seconds(300),
                    parameterStoreTtl: Duration.seconds(300),
                    maxConnections: 20,
                    logLevel: ParamsAndSecretsLogLevel.DEBUG,
                }
            ),
            currentVersionOptions: {
                removalPolicy: RemovalPolicy.DESTROY,
            },
            environment: {
                SECRET_NAME: snsToSlackSecret.secretName,
                NODE_ENV: 'production'
            },
        });

        snsToSlackSecret.grantRead(snsToSlackFn);
        snsToSlackFn.grantInvoke(new iam.ServicePrincipal('sns.amazonaws.com'));

        new sns.Subscription(this, 'snsToSlackSnsSubscription', {
            topic: props.snsTopic,
            protocol: sns.SubscriptionProtocol.LAMBDA,
            endpoint: snsToSlackFn.functionArn,
        });
    }
}
