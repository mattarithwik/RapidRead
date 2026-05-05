import * as cdk from "aws-cdk-lib";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class NewsRecommenderStack extends cdk.Stack {
  public readonly newsTable: dynamodb.Table;
  public readonly rawArticlesBucket: s3.Bucket;

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

    const enableSchedules = this.node.tryGetContext("enableSchedules") === "true";
    const sharedEnvironment = {
      STORAGE_BACKEND: "aws",
      NEWS_TABLE_NAME: table.tableName,
      RAW_ARTICLES_BUCKET: rawBucket.bucketName,
      INGEST_MAX_ARTICLES: "200",
      ENRICHMENT_BATCH_SIZE: "50",
      ENABLE_BEDROCK: "true",
      BEDROCK_TEXT_MODEL_ID: "anthropic.claude-3-haiku-20240307-v1:0",
      BEDROCK_EMBEDDING_MODEL_ID: "amazon.titan-embed-text-v2:0"
    };

    const bundling: nodejs.BundlingOptions = {
      bundleAwsSDK: true,
      minify: true,
      sourceMap: true,
      target: "node20"
    };

    const ingestionFunction = new nodejs.NodejsFunction(this, "IngestionFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: "lambda/ingestion.ts",
      handler: "handler",
      timeout: Duration.minutes(5),
      memorySize: 512,
      environment: sharedEnvironment,
      bundling
    });

    const enrichmentFunction = new nodejs.NodejsFunction(this, "EnrichmentFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: "lambda/enrichment.ts",
      handler: "handler",
      timeout: Duration.minutes(10),
      memorySize: 1024,
      environment: sharedEnvironment,
      bundling
    });

    rawBucket.grantReadWrite(ingestionFunction);
    table.grantReadWriteData(ingestionFunction);
    table.grantReadWriteData(enrichmentFunction);
    rawBucket.grantRead(enrichmentFunction);

    const bedrockPolicy = new iam.PolicyStatement({
      actions: ["bedrock:InvokeModel"],
      resources: ["*"]
    });
    ingestionFunction.addToRolePolicy(bedrockPolicy);
    enrichmentFunction.addToRolePolicy(bedrockPolicy);

    new events.Rule(this, "IngestionSchedule", {
      schedule: events.Schedule.rate(Duration.hours(2)),
      enabled: enableSchedules,
      targets: [new targets.LambdaFunction(ingestionFunction)]
    });

    new events.Rule(this, "EnrichmentSchedule", {
      schedule: events.Schedule.rate(Duration.hours(2)),
      enabled: enableSchedules,
      targets: [new targets.LambdaFunction(enrichmentFunction)]
    });

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      removalPolicy: RemovalPolicy.DESTROY
    });

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      authFlows: {
        userSrp: true,
        userPassword: true
      },
      preventUserExistenceErrors: true
    });

    new cdk.CfnOutput(this, "NewsTableName", { value: table.tableName });
    new cdk.CfnOutput(this, "RawArticlesBucketName", { value: rawBucket.bucketName });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, "IngestionFunctionName", { value: ingestionFunction.functionName });
    new cdk.CfnOutput(this, "EnrichmentFunctionName", { value: enrichmentFunction.functionName });

    this.newsTable = table;
    this.rawArticlesBucket = rawBucket;
  }
}
