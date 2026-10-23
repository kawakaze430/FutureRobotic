import {SQSClient,SendMessageCommand,ReceiveMessageCommand,DeleteMessageCommand} from '@aws-sdk/client-sqs';
import type {Db} from './db.js';
export class SqsWakeup {
 constructor(private client:SQSClient,private url:string){}
 async publish(db:Db){
  const jobs=await db.query('SELECT id FROM jobs WHERE status=\'queued\' AND notified_at IS NULL ORDER BY created_at LIMIT 20');
  for(const job of jobs.rows){await this.client.send(new SendMessageCommand({QueueUrl:this.url,MessageBody:JSON.stringify({jobId:job.id})}));await db.query('UPDATE jobs SET notified_at=now() WHERE id=$1',[job.id]);}
 }
 async wait(){const response=await this.client.send(new ReceiveMessageCommand({QueueUrl:this.url,MaxNumberOfMessages:10,WaitTimeSeconds:10,VisibilityTimeout:30}));for(const message of response.Messages??[])if(message.ReceiptHandle)await this.client.send(new DeleteMessageCommand({QueueUrl:this.url,ReceiptHandle:message.ReceiptHandle}));}
}
