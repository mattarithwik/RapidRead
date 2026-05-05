#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { NewsRecommenderStack } from "../lib/news-recommender-stack";
import { RapidReadWebStack } from "../lib/web-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1"
};

const backend = new NewsRecommenderStack(app, "NewsRecommenderStack", { env });

new RapidReadWebStack(app, "RapidReadWebStack", {
  env,
  newsTable: backend.newsTable,
  rawArticlesBucket: backend.rawArticlesBucket
});
