#!/usr/bin/env python3
"""Generate src/components/icons/svgIconDefs.ts"""
import os, json

OUT = os.path.join(os.path.dirname(__file__), "src/components/icons/svgIconDefs.ts")

# Colors
O='#FF9900';P='#8C4FFF';R='#DD344C';G2='#1B660F';B='#3B48CC'
A='#50E6FF';Y='#FFCA00'
GB='#4285F4';GG='#34A853';GY='#FBBC04';GR='#EA4335'
AI='#6B2FA0';AO='#F7941D'
GE='#6B7280'

def sym(id, body):
    return f'<symbol id="i-{id}" viewBox="0 0 24 24">{body}</symbol>'

def aws_wrap(body):
    return f'<rect x="2" y="2" width="20" height="20" rx="3" fill="#232F3E"/>{body}'

def az_wrap(body):
    return f'<rect x="2" y="2" width="20" height="20" rx="3" fill="#0078D4"/>{body}'

lines = []
# The arrowhead marker is not emitted here: it is theme-dependent and lives
# in src/components/editor/canvas/Defs.tsx.

# ═══ AWS ═══
aws = {
'aws-ec2': f'<rect x="5" y="5" width="14" height="14" rx="1" fill="{O}" opacity="0.9"/><rect x="7" y="7" width="4" height="4" fill="#232F3E"/><rect x="13" y="7" width="4" height="4" fill="#232F3E"/><rect x="10" y="13" width="4" height="4" fill="#232F3E"/>',
'aws-s3': f'<path d="M6,6h12l-1,12H7z" fill="{G2}"/><ellipse cx="12" cy="6" rx="6" ry="2" fill="{G2}"/>',
'aws-lambda': f'<path d="M6,18L10.5,6h2.5l-5,12H6Z" fill="{O}"/><path d="M12,6h2.5l4.5,12h-2.5z" fill="{O}"/>',
'aws-rds': f'<ellipse cx="12" cy="6" rx="7" ry="2.5" fill="{B}"/><path d="M5,6v12c0,1.4,3.1,2.5,7,2.5s7-1.1,7-2.5V6" fill="none" stroke="{B}" stroke-width="1.5"/><ellipse cx="12" cy="18" rx="7" ry="2.5" fill="{B}" opacity="0.5"/>',
'aws-dynamodb': f'<path d="M6,8h12M6,12h12M6,16h12" stroke="{B}" stroke-width="2"/><path d="M16,6l2,2-2,2" stroke="{O}" stroke-width="1.5" fill="none"/>',
'aws-apigateway': f'<path d="M4,12h5M15,12h5" stroke="{O}" stroke-width="2"/><rect x="9" y="6" width="6" height="12" rx="1.5" fill="{P}"/>',
'aws-cloudfront': f'<circle cx="12" cy="12" r="7" fill="none" stroke="{P}" stroke-width="1.5"/><ellipse cx="12" cy="12" rx="3" ry="7" fill="none" stroke="{P}" stroke-width="1"/><line x1="5" y1="12" x2="19" y2="12" stroke="{P}" stroke-width="1"/>',
'aws-ecs': f'<rect x="5" y="5" width="6" height="6" rx="1" fill="{O}"/><rect x="13" y="5" width="6" height="6" rx="1" fill="{O}"/><rect x="5" y="13" width="6" height="6" rx="1" fill="{O}"/><rect x="13" y="13" width="6" height="6" rx="1" fill="{O}" opacity="0.5"/>',
'aws-eks': f'<circle cx="12" cy="7" r="2" fill="{O}"/><circle cx="7" cy="16" r="2" fill="{O}"/><circle cx="17" cy="16" r="2" fill="{O}"/><line x1="12" y1="9" x2="7" y2="14" stroke="{O}" stroke-width="1.2"/><line x1="12" y1="9" x2="17" y2="14" stroke="{O}" stroke-width="1.2"/>',
'aws-sqs': f'<rect x="5" y="9" width="3" height="6" rx="1" fill="{O}"/><rect x="10" y="9" width="3" height="6" rx="1" fill="{O}" opacity="0.7"/><rect x="15" y="9" width="3" height="6" rx="1" fill="{O}" opacity="0.4"/>',
'aws-sns': f'<circle cx="12" cy="10" r="4" fill="{O}"/><path d="M8,15l-3,4M12,14v5M16,15l3,4" stroke="{O}" stroke-width="1.5"/>',
'aws-route53': f'<circle cx="12" cy="12" r="7" fill="none" stroke="{P}" stroke-width="1.5"/><text x="12" y="16" text-anchor="middle" fill="{O}" font-size="9" font-weight="bold">53</text>',
'aws-iam': f'<circle cx="12" cy="9" r="3.5" fill="{R}"/><path d="M6,19c0-3.5,2.7-6,6-6s6,2.5,6,6" fill="{R}" opacity="0.5"/>',
'aws-cloudwatch': f'<circle cx="12" cy="12" r="7" fill="none" stroke="{O}" stroke-width="1.5"/><polyline points="8,14 10,10 12,13 14,8 16,11" stroke="{O}" stroke-width="1.5" fill="none"/>',
'aws-cognito': f'<circle cx="9" cy="9" r="3" fill="{R}"/><circle cx="15" cy="9" r="3" fill="{R}" opacity="0.6"/><path d="M5,19c0-3,2-5,7-5s7,2,7,5" fill="{R}" opacity="0.4"/>',
'aws-stepfunctions': f'<circle cx="8" cy="7" r="2.5" fill="#FF4F8B"/><circle cx="16" cy="12" r="2.5" fill="#FF4F8B"/><circle cx="8" cy="17" r="2.5" fill="#FF4F8B"/><path d="M10.5,7L13.5,12M13.5,12L10.5,17" stroke="#FF4F8B" stroke-width="1.2"/>',
'aws-sagemaker': f'<circle cx="12" cy="12" r="6" fill="none" stroke="{G2}" stroke-width="1.5"/><path d="M8,14Q10,6,14,12Q16,16,18,9" stroke="{G2}" stroke-width="1.5" fill="none"/>',
'aws-redshift': f'<rect x="5" y="10" width="3" height="8" fill="{B}"/><rect x="10" y="7" width="3" height="11" fill="{B}" opacity="0.8"/><rect x="15" y="12" width="3" height="6" fill="{B}" opacity="0.6"/>',
'aws-elasticache': f'<path d="M12,5L19,12L12,19L5,12Z" fill="none" stroke="{B}" stroke-width="1.8"/><circle cx="12" cy="12" r="2.5" fill="{B}"/>',
'aws-kinesis': f'<path d="M5,7Q12,5,19,7" stroke="{P}" stroke-width="2" fill="none"/><path d="M5,12Q12,10,19,12" stroke="{P}" stroke-width="2" fill="none"/><path d="M5,17Q12,15,19,17" stroke="{P}" stroke-width="2" fill="none"/>',
'aws-codepipeline': f'<circle cx="6" cy="12" r="2" fill="{O}"/><circle cx="12" cy="12" r="2" fill="{O}"/><circle cx="18" cy="12" r="2" fill="{O}"/><line x1="8" y1="12" x2="10" y2="12" stroke="{O}" stroke-width="1.5"/><line x1="14" y1="12" x2="16" y2="12" stroke="{O}" stroke-width="1.5"/>',
'aws-athena': f'<circle cx="12" cy="11" r="5" fill="none" stroke="{P}" stroke-width="1.5"/><line x1="15.5" y1="14.5" x2="19" y2="18" stroke="{P}" stroke-width="2"/>',
'aws-glue': f'<rect x="5" y="5" width="5" height="5" rx="1" fill="{P}"/><rect x="14" y="14" width="5" height="5" rx="1" fill="{P}"/><path d="M10,7.5h4l-4,9h4" stroke="{P}" stroke-width="1.3" fill="none"/>',
'aws-emr': f'<circle cx="8" cy="8" r="3" fill="{O}" opacity="0.8"/><circle cx="16" cy="8" r="3" fill="{O}" opacity="0.6"/><circle cx="12" cy="15" r="3" fill="{O}" opacity="0.4"/>',
'aws-msk': f'<rect x="5" y="6" width="4" height="12" rx="1" fill="{O}"/><rect x="10" y="6" width="4" height="12" rx="1" fill="{O}" opacity="0.7"/><rect x="15" y="6" width="4" height="12" rx="1" fill="{O}" opacity="0.4"/>',
'aws-eventbridge': f'<circle cx="12" cy="12" r="5" fill="#FF4F8B" opacity="0.3"/><circle cx="12" cy="12" r="2.5" fill="#FF4F8B"/><path d="M6,6l3,3M18,6l-3,3M6,18l3,-3M18,18l-3,-3" stroke="#FF4F8B" stroke-width="1.3"/>',
'aws-waf': f'<path d="M12,4L19,7v4.5c0,4-3,7.5-7,8.5-4-1-7-4.5-7-8.5V7z" fill="{R}" opacity="0.8"/>',
'aws-secretsmanager': f'<rect x="6" y="10" width="12" height="9" rx="2" fill="{R}"/><path d="M9,10V7.5a3,3,0,0,1,6,0V10" fill="none" stroke="{R}" stroke-width="1.8"/><circle cx="12" cy="14.5" r="1.5" fill="#232F3E"/>',
'aws-ecr': f'<rect x="5" y="5" width="14" height="14" rx="2" fill="{O}" opacity="0.2"/><rect x="7" y="7" width="4" height="4" fill="{O}"/><rect x="13" y="7" width="4" height="4" fill="{O}" opacity="0.7"/>',
}
for k,v in aws.items():
    lines.append(sym(k, aws_wrap(v)))

# ═══ Azure ═══
azure = {
'az-vm': f'<rect x="5" y="5" width="14" height="11" rx="1" fill="{A}" opacity="0.3"/><rect x="9" y="17" width="6" height="2" rx="0.5" fill="{A}"/>',
'az-blob': f'<ellipse cx="12" cy="7" rx="7" ry="3" fill="{A}" opacity="0.7"/><path d="M5,7v10c0,1.7,3.1,3,7,3s7-1.3,7-3V7" fill="{A}" opacity="0.4"/>',
'az-functions': f'<path d="M10,6l4,6-6,6" stroke="{Y}" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
'az-sqldb': f'<ellipse cx="12" cy="7" rx="7" ry="2.5" fill="{A}"/><path d="M5,7v10c0,1.4,3.1,2.5,7,2.5s7-1.1,7-2.5V7" fill="{A}" opacity="0.4"/>',
'az-cosmosdb': f'<circle cx="12" cy="12" r="6" fill="none" stroke="{A}" stroke-width="1.5"/><circle cx="12" cy="12" r="2.5" fill="{A}"/>',
'az-apim': f'<rect x="6" y="8" width="12" height="3" rx="1" fill="{A}" opacity="0.4"/><rect x="6" y="13" width="12" height="3" rx="1" fill="{A}" opacity="0.4"/>',
'az-appservice': f'<rect x="5" y="5" width="14" height="14" rx="2" fill="{A}" opacity="0.3"/><rect x="5" y="5" width="14" height="4" fill="{A}" opacity="0.6"/>',
'az-aks': f'<circle cx="12" cy="6" r="2" fill="{A}"/><circle cx="7" cy="16" r="2" fill="{A}"/><circle cx="17" cy="16" r="2" fill="{A}"/>',
'az-servicebus': f'<path d="M6,12h12" stroke="#fff" stroke-width="2.5" stroke-dasharray="3 2"/><circle cx="5" cy="12" r="2" fill="{A}"/><circle cx="19" cy="12" r="2" fill="{A}"/>',
'az-eventhub': f'<path d="M5,12Q8,6,12,12Q16,18,19,12" stroke="#fff" stroke-width="2" fill="none"/>',
'az-entraid': f'<circle cx="12" cy="9" r="3.5" fill="{A}"/><path d="M6,20c0-4,2.7-6.5,6-6.5s6,2.5,6,6.5" fill="{A}" opacity="0.5"/>',
'az-monitor': f'<polyline points="5,16 8,10 11,14 14,7 17,11" stroke="{A}" stroke-width="2" fill="none"/>',
'az-keyvault': f'<rect x="6" y="11" width="12" height="8" rx="2" fill="{Y}"/><path d="M9,11V8a3,3,0,0,1,6,0v3" fill="none" stroke="{Y}" stroke-width="1.8"/>',
'az-logicapps': f'<rect x="8" y="5" width="8" height="4" rx="1" fill="{A}" opacity="0.7"/><rect x="8" y="15" width="8" height="4" rx="1" fill="{A}" opacity="0.7"/><line x1="12" y1="9" x2="12" y2="15" stroke="{A}" stroke-width="1.5"/>',
'az-ml': f'<path d="M6,17Q10,5,14,12Q16,16,18,8" stroke="{A}" stroke-width="2" fill="none"/><circle cx="7" cy="7" r="2" fill="{A}"/>',
'az-synapse': f'<circle cx="12" cy="12" r="4" fill="{A}" opacity="0.5"/><circle cx="12" cy="4" r="2" fill="{A}"/><circle cx="19" cy="16" r="2" fill="{A}"/>',
'az-redis': f'<path d="M3,14l9,-6 9,6-9,6z" fill="{A}"/>',
'az-datafactory': f'<rect x="5" y="5" width="5" height="5" rx="1" fill="{A}" opacity="0.6"/><rect x="14" y="5" width="5" height="5" rx="1" fill="{A}" opacity="0.6"/><rect x="9" y="14" width="6" height="5" rx="1" fill="{A}"/>',
'az-devops': f'<path d="M6,12a6,6,0,1,1,2,4.5" fill="none" stroke="{A}" stroke-width="2"/><path d="M6,12l0,-3 3,1.5z" fill="{A}"/>',
'az-containerapps': f'<rect x="5" y="5" width="6" height="6" rx="1.5" fill="{A}"/><rect x="13" y="5" width="6" height="6" rx="1.5" fill="{A}" opacity="0.6"/>',
'az-staticwebapps': f'<rect x="5" y="5" width="14" height="10" rx="1" fill="{A}" opacity="0.3"/><path d="M8,10l2,-2 2,2" stroke="#fff" stroke-width="1.5" fill="none"/>',
'az-openai': f'<circle cx="12" cy="12" r="6" fill="none" stroke="{A}" stroke-width="1.5"/><path d="M9,14L11,9h2l2,5" stroke="{A}" stroke-width="1.5" fill="none"/>',
'az-frontdoor': f'<path d="M8,19V5h8v14" stroke="{A}" stroke-width="1.5" fill="none"/><circle cx="14" cy="12" r="1" fill="{A}"/>',
'az-iothub': f'<circle cx="12" cy="12" r="4" fill="{A}"/><path d="M5,5a10,10,0,0,1,14,0" fill="none" stroke="{A}" stroke-width="1.5"/>',
}
for k,v in azure.items():
    lines.append(sym(k, az_wrap(v)))

# ═══ GCP ═══
gcp = {
'gcp-cloudrun': f'<rect x="2" y="2" width="20" height="20" rx="3" fill="{GB}"/><path d="M8,12l3,3 5-6" stroke="#fff" stroke-width="2" fill="none"/>',
'gcp-vertexai': f'<path d="M12,2L22,9L12,22L2,9Z" fill="{GB}"/><path d="M12,2L17,9L12,22L7,9Z" fill="#669DF6"/>',
'gcp-documentai': f'<rect x="5" y="2" width="14" height="20" rx="2" fill="{GB}"/><line x1="8" y1="7" x2="16" y2="7" stroke="#fff" stroke-width="1.3"/><line x1="8" y1="11" x2="16" y2="11" stroke="#fff" stroke-width="1.3"/><line x1="8" y1="15" x2="13" y2="15" stroke="#fff" stroke-width="1.3"/>',
'gcp-bigquery': f'<rect x="2" y="2" width="20" height="20" rx="3" fill="{GB}"/><rect x="5" y="10" width="3" height="8" fill="#fff" opacity="0.6"/><rect x="10" y="7" width="3" height="11" fill="#fff" opacity="0.8"/><rect x="15" y="12" width="3" height="6" fill="#fff"/>',
'gcp-cloudstorage': f'<rect x="3" y="7" width="18" height="5" rx="1" fill="{GB}"/><rect x="3" y="12" width="18" height="5" rx="1" fill="{GY}"/>',
'gcp-artifactregistry': f'<rect x="3" y="3" width="8" height="8" rx="1.5" fill="{GB}"/><rect x="13" y="3" width="8" height="8" rx="1.5" fill="{GG}"/><rect x="3" y="13" width="8" height="8" rx="1.5" fill="{GY}"/><rect x="13" y="13" width="8" height="8" rx="1.5" fill="{GR}"/>',
'gcp-computeengine': f'<rect x="3" y="3" width="18" height="18" rx="3" fill="{GB}"/><rect x="6" y="6" width="12" height="12" rx="1" fill="#fff" opacity="0.3"/>',
'gcp-cloudfunctions': f'<rect x="2" y="2" width="20" height="20" rx="3" fill="{GB}"/><path d="M8,8l5,4-5,4" stroke="#fff" stroke-width="2" fill="none"/>',
'gcp-cloudsql': f'<ellipse cx="12" cy="6" rx="7.5" ry="3" fill="{GB}"/><path d="M4.5,6v12c0,1.7,3.4,3,7.5,3s7.5-1.3,7.5-3V6" fill="{GB}" opacity="0.5"/>',
'gcp-firestore': f'<path d="M7,3h4v7l-4,2z" fill="{GY}"/><path d="M13,3h4v11l-4,2z" fill="{GB}"/><path d="M7,14h10v7H7z" fill="{GG}"/>',
'gcp-pubsub': f'<circle cx="12" cy="12" r="3.5" fill="{GB}"/><circle cx="5" cy="7" r="2.5" fill="{GG}"/><circle cx="19" cy="7" r="2.5" fill="{GG}"/><circle cx="5" cy="17" r="2.5" fill="{GR}"/><circle cx="19" cy="17" r="2.5" fill="{GR}"/>',
'gcp-cloudcdn': f'<circle cx="12" cy="12" r="9" fill="none" stroke="{GB}" stroke-width="1.5"/><line x1="3" y1="12" x2="21" y2="12" stroke="{GY}" stroke-width="1.3"/>',
'gcp-gke': f'<circle cx="12" cy="12" r="10" fill="{GB}"/><circle cx="12" cy="6" r="2" fill="#fff"/><circle cx="7" cy="17" r="2" fill="#fff"/><circle cx="17" cy="17" r="2" fill="#fff"/>',
'gcp-iam': f'<path d="M12,2L20,5.5V11C20,16.5,16.5,20.7,12,22C7.5,20.7,4,16.5,4,11V5.5Z" fill="{GB}"/><circle cx="12" cy="10" r="2.5" fill="#fff"/>',
'gcp-monitoring': f'<rect x="2" y="2" width="20" height="20" rx="3" fill="{GB}"/><polyline points="5,16 8,10 11,14 14,7 17,11" stroke="#fff" stroke-width="1.5" fill="none"/>',
'gcp-apigee': f'<circle cx="12" cy="12" r="10" fill="{GB}"/><text x="12" y="15.5" text-anchor="middle" fill="#fff" font-size="7" font-weight="bold">API</text>',
'gcp-dataflow': f'<rect x="2" y="2" width="20" height="20" rx="3" fill="{GB}"/><path d="M6,8h4l2,4 2-4h4" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M6,16h4l2,-4 2,4h4" stroke="#fff" stroke-width="1.5" fill="none"/>',
'gcp-dataproc': f'<rect x="2" y="2" width="20" height="20" rx="3" fill="{GB}"/><circle cx="9" cy="9" r="2.5" fill="#fff" opacity="0.7"/><circle cx="15" cy="9" r="2.5" fill="#fff" opacity="0.7"/><circle cx="12" cy="15" r="2.5" fill="#fff" opacity="0.7"/>',
}
for k,v in gcp.items():
    lines.append(sym(k, v))

# ═══ AION ═══
aion = {
'aion-chatbot': f'<rect x="3" y="3" width="18" height="14" rx="3" fill="{AI}"/><path d="M8,17l4,4v-4" fill="{AI}"/><circle cx="8.5" cy="10" r="1.3" fill="{AO}"/><circle cx="12" cy="10" r="1.3" fill="{AO}"/><circle cx="15.5" cy="10" r="1.3" fill="{AO}"/>',
'aion-pipeline': f'<rect x="2" y="8" width="6" height="8" rx="1.5" fill="{AI}"/><rect x="9" y="8" width="6" height="8" rx="1.5" fill="#8B4FC0"/><rect x="16" y="8" width="6" height="8" rx="1.5" fill="{AO}"/>',
'aion-mlmodel': f'<circle cx="12" cy="12" r="9" fill="{AI}"/><path d="M7,16Q10,5,14,12Q16,16,18,9" stroke="{AO}" stroke-width="2" fill="none"/>',
'aion-dashboard': f'<rect x="3" y="3" width="18" height="18" rx="2" fill="{AI}"/><rect x="5" y="5" width="7" height="5" rx="1" fill="{AO}" opacity="0.8"/><rect x="14" y="5" width="5" height="5" rx="1" fill="#fff" opacity="0.3"/><rect x="5" y="12" width="5" height="7" rx="1" fill="#fff" opacity="0.3"/><rect x="12" y="12" width="7" height="7" rx="1" fill="{AO}" opacity="0.5"/>',
'aion-automation': f'<rect x="3" y="3" width="18" height="18" rx="2" fill="{AI}"/><circle cx="12" cy="12" r="5" fill="none" stroke="{AO}" stroke-width="2"/><circle cx="12" cy="12" r="1.5" fill="{AO}"/>',
}
for k,v in aion.items():
    lines.append(sym(k, v))

# ═══ Generic ═══
generic = {
'gen-user': f'<circle cx="12" cy="7.5" r="4.2" fill="{GE}"/><path d="M4,21C4,15.5,7.5,13,12,13C16.5,13,20,15.5,20,21Z" fill="{GE}"/>',
'gen-web': f'<rect x="2.5" y="4" width="19" height="16" rx="1.8" fill="none" stroke="{GE}" stroke-width="1.9"/><line x1="2.5" y1="8.2" x2="21.5" y2="8.2" stroke="{GE}" stroke-width="1.9"/>',
'gen-database': f'<ellipse cx="12" cy="6" rx="8" ry="3" fill="{GE}"/><path d="M4,6v12" stroke="{GE}" stroke-width="1.5"/><path d="M20,6v12" stroke="{GE}" stroke-width="1.5"/><ellipse cx="12" cy="18" rx="8" ry="3" fill="{GE}" opacity="0.5"/>',
'gen-api': f'<rect x="3" y="3" width="18" height="18" rx="2" fill="{GE}"/><text x="12" y="15" text-anchor="middle" fill="#fff" font-size="7" font-weight="bold">API</text>',
'gen-loadbalancer': f'<circle cx="12" cy="5" r="3" fill="{GE}"/><circle cx="6" cy="19" r="3" fill="{GE}"/><circle cx="18" cy="19" r="3" fill="{GE}"/><line x1="12" y1="8" x2="6" y2="16" stroke="{GE}" stroke-width="1.5"/><line x1="12" y1="8" x2="18" y2="16" stroke="{GE}" stroke-width="1.5"/>',
'gen-firewall': f'<rect x="3" y="3" width="18" height="18" rx="2" fill="#EF4444"/><rect x="6" y="6" width="12" height="3" fill="#fff" opacity="0.3"/><rect x="6" y="11" width="12" height="3" fill="#fff" opacity="0.3"/>',
'gen-dns': f'<circle cx="12" cy="12" r="9" fill="{GE}"/><text x="12" y="15" text-anchor="middle" fill="#fff" font-size="6" font-weight="bold">DNS</text>',
'gen-cdn': f'<circle cx="12" cy="12" r="9" fill="none" stroke="{GE}" stroke-width="1.5"/><ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="{GE}" stroke-width="1"/>',
'gen-container': f'<rect x="3" y="5" width="18" height="14" rx="2" fill="#2563EB"/><rect x="5" y="7" width="4" height="3" fill="#fff" opacity="0.4"/><rect x="10" y="7" width="4" height="3" fill="#fff" opacity="0.4"/>',
'gen-serverless': f'<path d="M4,20L12,4L20,20Z" fill="#8B5CF6"/><path d="M9,20L12,12L15,20" stroke="#fff" stroke-width="1.2" fill="none"/>',
'gen-queue': f'<rect x="2" y="7" width="20" height="10" rx="2" fill="{GE}"/><line x1="6" y1="12" x2="18" y2="12" stroke="#fff" stroke-width="2" stroke-dasharray="3 2"/>',
'gen-cache': f'<path d="M3,12L12,7L21,12L12,17Z" fill="#10B981"/><path d="M3,12v3L12,20L21,15V12" fill="#10B981" opacity="0.6"/>',
'gen-mlai': f'<rect x="3" y="3" width="18" height="18" rx="2" fill="#7C3AED"/><path d="M7,16Q10,5,14,12Q16,16,18,9" stroke="#fff" stroke-width="1.5" fill="none"/>',
'gen-iot': f'<circle cx="12" cy="12" r="4" fill="{GE}"/><path d="M6,6a8.5,8.5,0,0,1,12,0" fill="none" stroke="{GE}" stroke-width="1.5"/>',
'gen-mobile': f'<rect x="7" y="2" width="10" height="20" rx="2" fill="{GE}"/><circle cx="12" cy="19" r="1.2" fill="#fff"/>',
'gen-desktop': f'<rect x="2" y="4" width="20" height="14" rx="1.5" fill="{GE}"/><rect x="8" y="19" width="8" height="1.5" fill="{GE}"/>',
'gen-server': f'<rect x="4" y="3" width="16" height="18" rx="1.5" fill="{GE}"/><line x1="4" y1="9" x2="20" y2="9" stroke="#fff" stroke-width="0.8"/><line x1="4" y1="15" x2="20" y2="15" stroke="#fff" stroke-width="0.8"/><circle cx="7" cy="6" r="1" fill="#10B981"/>',
'gen-network': f'<circle cx="6" cy="6" r="2.5" fill="{GE}"/><circle cx="18" cy="6" r="2.5" fill="{GE}"/><circle cx="6" cy="18" r="2.5" fill="{GE}"/><circle cx="18" cy="18" r="2.5" fill="{GE}"/><circle cx="12" cy="12" r="2.5" fill="{GE}"/>',
'gen-shield': f'<path d="M12,2L20,5.5V11C20,16.5,16.5,20.7,12,22C7.5,20.7,4,16.5,4,11V5.5Z" fill="{GE}"/><path d="M10,12l2,2 4-4" stroke="#fff" stroke-width="1.5" fill="none"/>',
'gen-monitoring': f'<rect x="3" y="3" width="18" height="18" rx="2" fill="{GE}"/><polyline points="6,16 9,10 12,14 15,7 18,11" stroke="#fff" stroke-width="1.5" fill="none"/>',
'gen-cicd': f'<rect x="3" y="3" width="18" height="18" rx="2" fill="{GE}"/><path d="M6,12a6,6,0,1,1,2,4.5" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M6,12l0,-3 3,1.5z" fill="#fff"/>',
'gen-git': f'<circle cx="8" cy="7" r="2.5" fill="#F05033"/><circle cx="16" cy="7" r="2.5" fill="#F05033"/><circle cx="8" cy="17" r="2.5" fill="#F05033"/><line x1="8" y1="9.5" x2="8" y2="14.5" stroke="#F05033" stroke-width="1.5"/>',
'gen-docker': f'<rect x="3" y="8" width="18" height="12" rx="2" fill="#2496ED"/><rect x="5" y="4" width="4" height="4" fill="#2496ED"/><rect x="5" y="10" width="4" height="3" fill="#fff" opacity="0.3"/><rect x="10" y="10" width="4" height="3" fill="#fff" opacity="0.3"/>',
'gen-kubernetes': f'<circle cx="12" cy="12" r="9" fill="#326CE5"/><path d="M12,5L12,19M7,8L17,16M17,8L7,16" stroke="#fff" stroke-width="1.3" fill="none"/>',
'gen-terraform': f'<path d="M1,5l8,4.5v9L1,14Z" fill="#7B42BC"/><path d="M10,9.5l8,4.5v9l-8,-4.5Z" fill="#7B42BC"/><path d="M10,0l8,4.5v9L10,9Z" fill="#7B42BC" opacity="0.7"/>',
'gen-redis': f'<path d="M12,4L21,12L12,20L3,12Z" fill="#DC382D"/>',
'gen-postgresql': f'<ellipse cx="12" cy="6" rx="7" ry="3" fill="#336791"/><path d="M5,6v12c0,1.7,3.1,3,7,3s7-1.3,7-3V6" fill="#336791" opacity="0.5"/>',
'gen-mysql': f'<ellipse cx="12" cy="6" rx="7" ry="3" fill="#4479A1"/><path d="M5,6v12c0,1.7,3.1,3,7,3s7-1.3,7-3V6" fill="#4479A1" opacity="0.5"/>',
'gen-mongodb': f'<path d="M12,2C8,6,6,10,6,14c0,4,2.7,8,6,8s6-4,6-8C18,10,16,6,12,2Z" fill="#13AA52"/>',
'gen-elasticsearch': f'<circle cx="12" cy="12" r="9" fill="#FEC514"/><path d="M4,12h16" stroke="#343741" stroke-width="3"/>',
'gen-kafka': f'<circle cx="12" cy="12" r="3" fill="#231F20"/><circle cx="6" cy="7" r="2" fill="#231F20"/><circle cx="18" cy="7" r="2" fill="#231F20"/><circle cx="6" cy="17" r="2" fill="#231F20"/><circle cx="18" cy="17" r="2" fill="#231F20"/>',
'gen-rabbitmq': f'<rect x="3" y="3" width="18" height="18" rx="2" fill="#FF6600"/><text x="12" y="15" text-anchor="middle" fill="#fff" font-size="6" font-weight="bold">MQ</text>',
'gen-nginx': f'<rect x="3" y="3" width="18" height="18" rx="2" fill="#009639"/><text x="12" y="15" text-anchor="middle" fill="#fff" font-size="6" font-weight="bold">Nx</text>',
'gen-prometheus': f'<circle cx="12" cy="12" r="9" fill="#E6522C"/><path d="M12,4v16M6,8l12,8M6,16l12,-8" stroke="#fff" stroke-width="1"/>',
'gen-grafana': f'<circle cx="12" cy="12" r="9" fill="#F46800"/><polyline points="6,15 9,9 12,13 15,7 18,11" stroke="#fff" stroke-width="1.5" fill="none"/>',
}
for k,v in generic.items():
    lines.append(sym(k, v))

# Also add new service entries to serviceIcons.ts
new_services = [
    # New AWS
    ('aws-athena', 'Athena', 'aws', 'Analytics', 'Interactive query service'),
    ('aws-glue', 'Glue', 'aws', 'Analytics', 'ETL service'),
    ('aws-emr', 'EMR', 'aws', 'Analytics', 'Big data processing'),
    ('aws-msk', 'MSK', 'aws', 'Messaging', 'Managed Kafka'),
    ('aws-eventbridge', 'EventBridge', 'aws', 'Messaging', 'Serverless event bus'),
    ('aws-waf', 'WAF', 'aws', 'Security', 'Web application firewall'),
    ('aws-secretsmanager', 'Secrets Manager', 'aws', 'Security', 'Secret management'),
    ('aws-ecr', 'ECR', 'aws', 'Containers', 'Container registry'),
    # New Azure
    ('az-containerapps', 'Container Apps', 'azure', 'Containers', 'Serverless containers'),
    ('az-staticwebapps', 'Static Web Apps', 'azure', 'Compute', 'Static site hosting'),
    ('az-openai', 'Azure OpenAI', 'azure', 'ML/AI', 'OpenAI models on Azure'),
    ('az-frontdoor', 'Front Door', 'azure', 'Networking', 'Global load balancer & CDN'),
    ('az-iothub', 'IoT Hub', 'azure', 'IoT', 'IoT device management'),
    # New Generic
    ('gen-redis', 'Redis', 'generic', 'Data', 'In-memory data store'),
    ('gen-postgresql', 'PostgreSQL', 'generic', 'Data', 'Relational database'),
    ('gen-mysql', 'MySQL', 'generic', 'Data', 'Relational database'),
    ('gen-mongodb', 'MongoDB', 'generic', 'Data', 'Document database'),
    ('gen-elasticsearch', 'Elasticsearch', 'generic', 'Data', 'Search engine'),
    ('gen-kafka', 'Kafka', 'generic', 'Messaging', 'Event streaming platform'),
    ('gen-rabbitmq', 'RabbitMQ', 'generic', 'Messaging', 'Message broker'),
    ('gen-nginx', 'Nginx', 'generic', 'Networking', 'Web server & reverse proxy'),
    ('gen-prometheus', 'Prometheus', 'generic', 'Monitoring', 'Metrics & alerting'),
    ('gen-grafana', 'Grafana', 'generic', 'Monitoring', 'Observability dashboards'),
]

# Write icon defs
content = "// Auto-generated SVG icon definitions — do not edit manually\n"
content += "// Run: python3 build_icons.py\n"
content += "export const SVG_ICON_DEFS = `\n"
content += "\n".join(lines)
content += "\n`;\n"

with open(OUT, "w") as f:
    f.write(content)
print(f"Wrote {OUT} ({len(lines)} icons, {len(content)} bytes)")

# Append new services to serviceIcons.ts
svc_path = os.path.join(os.path.dirname(__file__), "src/data/serviceIcons.ts")
with open(svc_path, "r") as f:
    svc_content = f.read()

# Check which are missing
for key, label, cat, subcat, desc in new_services:
    if f"'{key}'" not in svc_content:
        # Insert before the closing ];
        entry = f"  {{ key: '{key}', label: '{label}', category: '{cat}', subcategory: '{subcat}', description: '{desc}' }},\n"
        svc_content = svc_content.replace("];", entry + "];", 1)

with open(svc_path, "w") as f:
    f.write(svc_content)
print(f"Updated {svc_path}")
