/**
 * Cloud service equivalence map.
 * Maps services across AWS, Azure, and GCP by functional role.
 * Each row is a set of equivalent services [aws, azure, gcp].
 * null = no direct equivalent in that cloud.
 */

export type CloudTarget = 'aws' | 'azure' | 'gcp';

interface Equivalence {
  role: string; // Functional role (e.g. "Serverless compute")
  subcategory: string; // Category grouping
  aws: string | null; // aws-xxx key
  azure: string | null; // az-xxx key
  gcp: string | null; // gcp-xxx key
}

export const CLOUD_EQUIVALENCES: Equivalence[] = [
  // ── Compute ────────────────────────────
  {
    role: 'Virtual machines',
    subcategory: 'Compute',
    aws: 'aws-ec2',
    azure: 'az-vm',
    gcp: 'gcp-computeengine',
  },
  {
    role: 'Serverless functions',
    subcategory: 'Compute',
    aws: 'aws-lambda',
    azure: 'az-functions',
    gcp: 'gcp-cloudfunctions',
  },
  {
    role: 'Serverless containers',
    subcategory: 'Compute',
    aws: 'aws-fargate',
    azure: 'az-containerapps',
    gcp: 'gcp-cloudrun',
  },
  {
    role: 'App hosting platform',
    subcategory: 'Compute',
    aws: 'aws-elasticbeanstalk',
    azure: 'az-appservice',
    gcp: 'gcp-appengine',
  },
  { role: 'Batch computing', subcategory: 'Compute', aws: 'aws-batch', azure: null, gcp: null },
  {
    role: 'Full-stack platform',
    subcategory: 'Compute',
    aws: 'aws-amplify',
    azure: 'az-staticwebapps',
    gcp: null,
  },
  {
    role: 'Workflow orchestration',
    subcategory: 'Compute',
    aws: 'aws-stepfunctions',
    azure: 'az-logicapps',
    gcp: 'gcp-workflows',
  },

  // ── Containers ─────────────────────────
  {
    role: 'Managed Kubernetes',
    subcategory: 'Containers',
    aws: 'aws-eks',
    azure: 'az-aks',
    gcp: 'gcp-gke',
  },
  {
    role: 'Container orchestration',
    subcategory: 'Containers',
    aws: 'aws-ecs',
    azure: 'az-containerapps',
    gcp: 'gcp-cloudrun',
  },
  {
    role: 'Container registry',
    subcategory: 'Containers',
    aws: 'aws-ecr',
    azure: null,
    gcp: 'gcp-artifactregistry',
  },
  {
    role: 'Hybrid/multi-cloud',
    subcategory: 'Containers',
    aws: null,
    azure: null,
    gcp: 'gcp-anthos',
  },

  // ── Storage ────────────────────────────
  {
    role: 'Object storage',
    subcategory: 'Storage',
    aws: 'aws-s3',
    azure: 'az-blob',
    gcp: 'gcp-cloudstorage',
  },
  { role: 'File storage', subcategory: 'Storage', aws: 'aws-efs', azure: 'az-files', gcp: null },
  { role: 'Block storage', subcategory: 'Storage', aws: null, azure: 'az-disks', gcp: null },
  {
    role: 'Backup service',
    subcategory: 'Storage',
    aws: 'aws-backup',
    azure: 'az-backup',
    gcp: null,
  },

  // ── Database ───────────────────────────
  {
    role: 'Managed relational DB',
    subcategory: 'Database',
    aws: 'aws-rds',
    azure: 'az-sqldb',
    gcp: 'gcp-cloudsql',
  },
  {
    role: 'MySQL/PostgreSQL managed',
    subcategory: 'Database',
    aws: 'aws-aurora',
    azure: 'az-postgresql',
    gcp: 'gcp-alloydb',
  },
  {
    role: 'NoSQL document DB',
    subcategory: 'Database',
    aws: 'aws-dynamodb',
    azure: 'az-cosmosdb',
    gcp: 'gcp-firestore',
  },
  {
    role: 'MongoDB compatible',
    subcategory: 'Database',
    aws: 'aws-documentdb',
    azure: 'az-cosmosdb-mongo',
    gcp: null,
  },
  {
    role: 'In-memory cache',
    subcategory: 'Database',
    aws: 'aws-elasticache',
    azure: 'az-redis',
    gcp: 'gcp-memorystore',
  },
  { role: 'Graph database', subcategory: 'Database', aws: 'aws-neptune', azure: null, gcp: null },
  {
    role: 'Wide-column NoSQL',
    subcategory: 'Database',
    aws: null,
    azure: null,
    gcp: 'gcp-bigtable',
  },
  {
    role: 'Global-scale DB',
    subcategory: 'Database',
    aws: null,
    azure: 'az-cosmosdb',
    gcp: 'gcp-cloudspanner',
  },
  {
    role: 'Data warehouse',
    subcategory: 'Database',
    aws: 'aws-redshift',
    azure: 'az-synapse',
    gcp: 'gcp-bigquery',
  },

  // ── Networking ─────────────────────────
  {
    role: 'API gateway',
    subcategory: 'Networking',
    aws: 'aws-apigateway',
    azure: 'az-apim',
    gcp: 'gcp-apigee',
  },
  {
    role: 'CDN',
    subcategory: 'Networking',
    aws: 'aws-cloudfront',
    azure: 'az-cdn',
    gcp: 'gcp-cloudcdn',
  },
  { role: 'DNS', subcategory: 'Networking', aws: 'aws-route53', azure: 'az-dnszone', gcp: null },
  {
    role: 'Load balancer',
    subcategory: 'Networking',
    aws: 'aws-elb',
    azure: 'az-loadbalancer',
    gcp: 'gcp-cloudloadbalancing',
  },
  {
    role: 'Virtual network',
    subcategory: 'Networking',
    aws: 'aws-vpc',
    azure: 'az-vnet',
    gcp: null,
  },
  {
    role: 'Dedicated connection',
    subcategory: 'Networking',
    aws: 'aws-directconnect',
    azure: 'az-expressroute',
    gcp: null,
  },
  {
    role: 'Network hub',
    subcategory: 'Networking',
    aws: 'aws-transitgateway',
    azure: null,
    gcp: null,
  },
  {
    role: 'App load balancer',
    subcategory: 'Networking',
    aws: null,
    azure: 'az-appgateway',
    gcp: null,
  },
  {
    role: 'Global LB + CDN',
    subcategory: 'Networking',
    aws: null,
    azure: 'az-frontdoor',
    gcp: null,
  },
  { role: 'VPN', subcategory: 'Networking', aws: null, azure: null, gcp: 'gcp-cloudvpn' },
  { role: 'NAT gateway', subcategory: 'Networking', aws: null, azure: null, gcp: 'gcp-cloudnat' },

  // ── Messaging ──────────────────────────
  {
    role: 'Message queue',
    subcategory: 'Messaging',
    aws: 'aws-sqs',
    azure: 'az-servicebus',
    gcp: 'gcp-pubsub',
  },
  {
    role: 'Notification / pub-sub',
    subcategory: 'Messaging',
    aws: 'aws-sns',
    azure: 'az-notificationhubs',
    gcp: 'gcp-pubsub',
  },
  {
    role: 'Event streaming',
    subcategory: 'Messaging',
    aws: 'aws-kinesis',
    azure: 'az-eventhub',
    gcp: 'gcp-dataflow',
  },
  {
    role: 'Managed Kafka',
    subcategory: 'Messaging',
    aws: 'aws-msk',
    azure: 'az-eventhub',
    gcp: null,
  },
  {
    role: 'Event bus',
    subcategory: 'Messaging',
    aws: 'aws-eventbridge',
    azure: null,
    gcp: 'gcp-cloudtasks',
  },
  { role: 'Email service', subcategory: 'Messaging', aws: 'aws-ses', azure: null, gcp: null },
  {
    role: 'Real-time messaging',
    subcategory: 'Messaging',
    aws: null,
    azure: 'az-signalr',
    gcp: null,
  },

  // ── Security ───────────────────────────
  {
    role: 'Identity & access',
    subcategory: 'Security',
    aws: 'aws-iam',
    azure: 'az-entraid',
    gcp: 'gcp-iam',
  },
  {
    role: 'Secret management',
    subcategory: 'Security',
    aws: 'aws-secretsmanager',
    azure: 'az-keyvault',
    gcp: 'gcp-secretmanager',
  },
  {
    role: 'WAF',
    subcategory: 'Security',
    aws: 'aws-waf',
    azure: 'az-firewall',
    gcp: 'gcp-cloudarmor',
  },
  {
    role: 'DDoS protection',
    subcategory: 'Security',
    aws: 'aws-shield',
    azure: 'az-defender',
    gcp: 'gcp-cloudarmor',
  },
  {
    role: 'User authentication',
    subcategory: 'Security',
    aws: 'aws-cognito',
    azure: 'az-entraid',
    gcp: null,
  },
  { role: 'Audit logging', subcategory: 'Security', aws: 'aws-cloudtrail', azure: null, gcp: null },
  {
    role: 'Key management',
    subcategory: 'Security',
    aws: null,
    azure: 'az-keyvault',
    gcp: 'gcp-cloudkms',
  },
  { role: 'SIEM', subcategory: 'Security', aws: null, azure: 'az-sentinel', gcp: null },
  { role: 'Secure access', subcategory: 'Security', aws: null, azure: 'az-bastion', gcp: null },

  // ── Monitoring ─────────────────────────
  {
    role: 'Monitoring',
    subcategory: 'Monitoring',
    aws: 'aws-cloudwatch',
    azure: 'az-monitor',
    gcp: 'gcp-monitoring',
  },
  { role: 'Logging', subcategory: 'Monitoring', aws: null, azure: null, gcp: 'gcp-cloudlogging' },

  // ── ML/AI ──────────────────────────────
  {
    role: 'ML platform',
    subcategory: 'ML/AI',
    aws: 'aws-sagemaker',
    azure: 'az-ml',
    gcp: 'gcp-vertexai',
  },
  {
    role: 'Foundation models / LLMs',
    subcategory: 'ML/AI',
    aws: 'aws-bedrock',
    azure: 'az-openai',
    gcp: 'gcp-vertexai',
  },
  {
    role: 'NLP service',
    subcategory: 'ML/AI',
    aws: 'aws-comprehend',
    azure: 'az-cognitiveservices',
    gcp: null,
  },
  {
    role: 'Image/video analysis',
    subcategory: 'ML/AI',
    aws: 'aws-rekognition',
    azure: 'az-cognitiveservices',
    gcp: 'gcp-vision',
  },
  {
    role: 'Document processing',
    subcategory: 'ML/AI',
    aws: 'aws-textract',
    azure: 'az-formrecognizer',
    gcp: 'gcp-documentai',
  },
  {
    role: 'Chatbot platform',
    subcategory: 'ML/AI',
    aws: 'aws-lex',
    azure: 'az-botservice',
    gcp: 'gcp-dialogflow',
  },
  {
    role: 'Speech services',
    subcategory: 'ML/AI',
    aws: null,
    azure: 'az-speechservice',
    gcp: 'gcp-speechtotext',
  },
  { role: 'Translation', subcategory: 'ML/AI', aws: null, azure: null, gcp: 'gcp-translate' },
  { role: 'AutoML', subcategory: 'ML/AI', aws: null, azure: null, gcp: 'gcp-automl' },
  { role: 'Search / cognitive', subcategory: 'ML/AI', aws: null, azure: 'az-search', gcp: null },

  // ── Analytics ──────────────────────────
  {
    role: 'Data integration / ETL',
    subcategory: 'Analytics',
    aws: 'aws-glue',
    azure: 'az-datafactory',
    gcp: 'gcp-dataflow',
  },
  {
    role: 'BI / dashboards',
    subcategory: 'Analytics',
    aws: 'aws-quicksight',
    azure: null,
    gcp: 'gcp-looker',
  },
  {
    role: 'Interactive SQL query',
    subcategory: 'Analytics',
    aws: 'aws-athena',
    azure: 'az-synapse',
    gcp: 'gcp-bigquery',
  },
  {
    role: 'Big data processing',
    subcategory: 'Analytics',
    aws: 'aws-emr',
    azure: 'az-databricks',
    gcp: 'gcp-dataproc',
  },
  {
    role: 'Stream analytics',
    subcategory: 'Analytics',
    aws: 'aws-kinesis',
    azure: 'az-streamanalytics',
    gcp: 'gcp-dataflow',
  },
  {
    role: 'Data lake',
    subcategory: 'Analytics',
    aws: 'aws-lakeformation',
    azure: 'az-synapse',
    gcp: null,
  },
  { role: 'Data governance', subcategory: 'Analytics', aws: null, azure: 'az-purview', gcp: null },

  // ── DevOps ─────────────────────────────
  {
    role: 'CI/CD pipeline',
    subcategory: 'DevOps',
    aws: 'aws-codepipeline',
    azure: 'az-devops',
    gcp: 'gcp-cloudbuild',
  },

  // ── IoT ────────────────────────────────
  { role: 'IoT management', subcategory: 'IoT', aws: null, azure: 'az-iothub', gcp: null },
];

/**
 * Given a service key, find its equivalent in the target cloud.
 * Returns the equivalent key, or null if no mapping exists.
 */
export function findEquivalent(sourceKey: string, targetCloud: CloudTarget): string | null {
  for (const eq of CLOUD_EQUIVALENCES) {
    const sourceCloud = sourceKey.startsWith('aws-')
      ? 'aws'
      : sourceKey.startsWith('az-')
        ? 'azure'
        : sourceKey.startsWith('gcp-')
          ? 'gcp'
          : null;
    if (!sourceCloud) return null;
    if (eq[sourceCloud as keyof Equivalence] === sourceKey) {
      return eq[targetCloud as keyof Equivalence] as string | null;
    }
  }
  return null;
}

/**
 * Get all equivalents for a service key.
 */
export function getEquivalents(
  sourceKey: string,
): { role: string; aws: string | null; azure: string | null; gcp: string | null } | null {
  const sourceCloud = sourceKey.startsWith('aws-')
    ? 'aws'
    : sourceKey.startsWith('az-')
      ? 'azure'
      : sourceKey.startsWith('gcp-')
        ? 'gcp'
        : null;
  if (!sourceCloud) return null;
  for (const eq of CLOUD_EQUIVALENCES) {
    if (eq[sourceCloud] === sourceKey) {
      return { role: eq.role, aws: eq.aws, azure: eq.azure, gcp: eq.gcp };
    }
  }
  return null;
}
