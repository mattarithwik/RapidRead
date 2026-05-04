import * as cdk from "aws-cdk-lib";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class NewsRecommenderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const rawBucket = new s3.Bucket(this, "RawArticlesBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const table = new dynamodb.Table(this, "NewsTable", {
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: RemovalPolicy.DESTROY
    });

    table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    const ingestionFunction = new lambda.Function(this, "IngestionFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      memorySize: 512,
      environment: {
        NEWS_TABLE_NAME: table.tableName,
        RAW_ARTICLES_BUCKET: rawBucket.bucketName,
        INGEST_MAX_ARTICLES: "200"
      },
      code: lambda.Code.fromInline(`
        exports.handler = async () => {
          console.log("Deploy the app bundle or point this Lambda at scripts/ingest.ts for production ingestion.");
          return { attemptedFeeds: 0, storedArticles: 0, failedFeeds: 0 };
        };
      `)
    });

    rawBucket.grantReadWrite(ingestionFunction);
    table.grantReadWriteData(ingestionFunction);
    ingestionFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: ["*"]
      })
    );

    new events.Rule(this, "IngestionSchedule", {
      schedule: events.Schedule.rate(Duration.hours(2)),
      enabled: false,
      targets: [new targets.LambdaFunction(ingestionFunction)]
    });

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      removalPolicy: RemovalPolicy.DESTROY
    });

    new cdk.CfnOutput(this, "NewsTableName", { value: table.tableName });
    new cdk.CfnOutput(this, "RawArticlesBucketName", { value: rawBucket.bucketName });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
  }
}
