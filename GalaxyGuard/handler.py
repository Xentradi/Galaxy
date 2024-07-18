import json
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
import torch

model_name = 'distilbert-base-uncased'
model = DistilBertForSequenceClassification.from_pretrained(model_name)
tokenizer = DistilBertTokenizerFast.from_pretrained(model_name)

def lambda_handler(event, context):
  body = json.loads(event['body'])
  text = body['text']

  try :
    inputs = tokenizer(text, return_tensors='pt')
    outputs = model(**inputs)
    predictions = torch.nn.functional.softmax(outputs.logits, dim=1)
    predicted_class = torch.argmax(predictions).item()

    return {
      'statusCode': 200,
      'body': json.dumps({
        'predicted_class': predicted_class
      })
    }    
  except Exception as e:
    return {
     'statusCode': 500,
      'body': json.dumps({
        'error': str(e)
      })
    }