import * as cdk from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NextjsSite } from "cdk-opennext";
import { Construct } from "constructs";

export interface RapidReadWebStackProps extends cdk.StackProps {
  readonly newsTable: dynamodb.ITable;
  readonly rawArticlesBucket: s3.IBucket;
}

/**
 * Next.js on AWS: S3 static assets + Lambda (Function URL) behind CloudFront via OpenNext.
 */
export class RapidReadWebStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RapidReadWebStackProps) {
    super(scope, id, props);

    const { newsTable, rawArticlesBucket } = props;

    const site = new NextjsSite(this, "RapidReadSite", {
      openNextPath: ".open-next",
      warm: false,
      prewarmOnDeploy: false,
      defaultFunctionProps: {
        timeout: Duration.seconds(30),
        memorySize: 1024,
        environment: {
          STORAGE_BACKEND: "aws",
          NEWS_TABLE_NAME: newsTable.tableName,
          RAW_ARTICLES_BUCKET: rawArticlesBucket.bucketName,
          NODE_ENV: "production",
          ADMIN_INGEST_ENABLED: "false",
          ENABLE_BEDROCK: "false",
          BEDROCK_TEXT_MODEL_ID: "anthropic.claude-3-haiku-20240307-v1:0",
          BEDROCK_EMBEDDING_MODEL_ID: "amazon.titan-embed-text-v2:0"
        }
      }
    });

    newsTable.grantReadWriteData(site.defaultServerFunction);
    rawArticlesBucket.grantReadWrite(site.defaultServerFunction);

    site.defaultServerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: ["*"]
      })
    );

    new cdk.CfnOutput(this, "SiteUrl", {
      value: site.url,
      description: "CloudFront URL for RapidRead (Next.js on Lambda)"
    });
    new cdk.CfnOutput(this, "DistributionId", {
      value: site.distribution?.distributionId ?? "",
      description: "CloudFront distribution id"
    });
  }
}
