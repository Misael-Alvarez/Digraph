#!/usr/bin/env python3
"""Import official AWS SVG icons into svgIconDefs.ts"""
import os, re, glob

AWS_DIR = "/tmp/package/icons/architecture-service"
OUT = os.path.join(os.path.dirname(__file__), "src/components/icons/svgIconDefs.ts")

# Map our icon keys to official AWS filenames
AWS_MAP = {
    'aws-ec2': 'AmazonEC2',
    'aws-s3': 'AmazonSimpleStorageService',
    'aws-lambda': 'AWSLambda',
    'aws-rds': 'AmazonRDS',
    'aws-dynamodb': 'AmazonDynamoDB',
    'aws-apigateway': 'AmazonAPIGateway',
    'aws-cloudfront': 'AmazonCloudFront',
    'aws-ecs': 'AmazonElasticContainerService',
    'aws-eks': 'AmazonElasticKubernetesService',
    'aws-sqs': 'AmazonSimpleQueueService',
    'aws-sns': 'AmazonSimpleNotificationService',
    'aws-route53': 'AmazonRoute53',
    'aws-iam': 'AWSIdentityAccessManagement',
    'aws-cloudwatch': 'AmazonCloudWatch',
    'aws-cognito': 'AmazonCognito',
    'aws-stepfunctions': 'AWSStepFunctions',
    'aws-sagemaker': 'AmazonSageMaker',
    'aws-redshift': 'AmazonRedshift',
    'aws-elasticache': 'AmazonElastiCache',
    'aws-kinesis': 'AmazonKinesis',
    'aws-codepipeline': 'AWSCodePipeline',
    'aws-athena': 'AmazonAthena',
    'aws-glue': 'AWSGlue',
    'aws-emr': 'AmazonEMR',
    'aws-msk': 'AmazonManagedStreamingForApacheKafka',
    'aws-eventbridge': 'AmazonEventBridge',
    'aws-waf': 'AWSWAF',
    'aws-secretsmanager': 'AWSSecretsManager',
    'aws-ecr': 'AmazonElasticContainerRegistry',
    'aws-cloudtrail': 'AWSCloudTrail',
    'aws-config': 'AWSConfig',
    'aws-shield': 'AWSShield',
    'aws-inspector': 'AmazonInspector',
    'aws-macie': 'AmazonMacie',
    'aws-neptune': 'AmazonNeptune',
    'aws-aurora': 'AmazonAurora',
    'aws-documentdb': 'AmazonDocumentDB',
    'aws-elasticbeanstalk': 'AWSElasticBeanstalk',
    'aws-fargate': 'AWSFargate',
    'aws-batch': 'AWSBatch',
    'aws-ses': 'AmazonSimpleEmailService',
    'aws-efs': 'AmazonElasticFileSystem',
    'aws-backup': 'AWSBackup',
    'aws-vpc': 'AmazonVPC',
    'aws-elb': 'ElasticLoadBalancing',
    'aws-quicksight': 'AmazonQuickSight',
    'aws-rekognition': 'AmazonRekognition',
    'aws-textract': 'AmazonTextract',
    'aws-lex': 'AmazonLex',
    'aws-bedrock': 'AmazonBedrock',
    'aws-amplify': 'AWSAmplify',
    'aws-cloudformation': 'AWSCloudFormation',
}

def extract_svg_inner(filepath):
    """Extract the inner content of an SVG file, adapting viewBox from 64 to 24"""
    with open(filepath) as f:
        svg = f.read()
    
    # Extract content between <svg> and </svg>
    # Remove the <svg> wrapper and <title>
    inner = re.sub(r'<\?xml[^>]*\?>', '', svg)
    inner = re.sub(r'<svg[^>]*>', '', inner)
    inner = re.sub(r'</svg>', '', inner)
    inner = re.sub(r'<title>[^<]*</title>', '', inner)
    inner = inner.strip()
    
    return inner

# Read current file
with open(OUT) as f:
    content = f.read()

replaced = 0
for our_key, aws_name in AWS_MAP.items():
    filepath = os.path.join(AWS_DIR, f"{aws_name}.svg")
    if not os.path.exists(filepath):
        # Try alternate names
        candidates = glob.glob(os.path.join(AWS_DIR, f"*{aws_name}*.svg"))
        if candidates:
            filepath = candidates[0]
        else:
            continue
    
    inner = extract_svg_inner(filepath)
    if not inner:
        continue
    
    # Build new symbol with viewBox 0 0 64 64 (native size)
    new_symbol = f'<symbol id="i-{our_key}" viewBox="0 0 64 64"><g fill="none" fill-rule="evenodd">{inner}</g></symbol>'
    
    # But the inner already has the <g> wrapper, so just use the raw inner
    new_symbol = f'<symbol id="i-{our_key}" viewBox="0 0 64 64">{inner}</symbol>'
    
    # Replace existing symbol
    pattern = f'<symbol id="i-{our_key}"[^>]*>.*?</symbol>'
    if re.search(pattern, content):
        content = re.sub(pattern, new_symbol, content)
        replaced += 1

with open(OUT, 'w') as f:
    f.write(content)

print(f"Replaced {replaced} AWS icons with official versions")
print(f"File size: {len(content)} bytes")
