import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Types } from 'aws-sdk/clients/s3';
import { TodoItem } from "../models/TodoItem";
import { TodoUpdate } from "../models/TodoUpdate";

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

// const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class ToDoAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
      private readonly s3Client: Types = new AWS.S3({ signatureVersion: 'v4' }),
    private readonly todoTable = process.env.TODOS_TABLE,
     private readonly s3BucketName = process.env.S3_BUCKET_NAME)
    
   {}
    

  async getAllToDos(userId: string): Promise<TodoItem[]> {
    console.log('Getting all todos')

    const result = await this.docClient
      .query({
        TableName: this.todoTable,
        KeyConditionExpression: '#userId = :userId',
        ExpressionAttributeNames: {
          '#userId': 'userId'
        },
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    console.log(result)

    const items = result.Items

    return items as TodoItem[]
  }

  async createToDo(todoItem: TodoItem): Promise<TodoItem> {
    console.log('Creating new todo')

    const result = await this.docClient
      .put({
        TableName: this.todoTable,
        Item: todoItem
      })
      .promise()

    console.log(result)

    return todoItem
  }

  async updateToDoItem(
    todoUpdate: TodoUpdate,
    todoId: string,
    userId: string
  ): Promise<TodoUpdate> {
    console.log('Updating todo')

    const result = await this.docClient
      .update({
        TableName: this.todoTable,
        Key: {
          userId: userId,
          todoId: todoId
        },
        UpdateExpression:
          'SET #name = :name, #dueDate = :dueDate, #done = :done',
        ExpressionAttributeNames: {
          '#name': 'todoItemName',
          '#dueDate': 'ItemDueDate',
          '#done': 'itemStatus'
        },
        ExpressionAttributeValues: {
          ':name': todoUpdate['name'],
          ':dueDate': todoUpdate['dueDate'],
          ':done': todoUpdate['done']
        },

        ReturnValues: 'ALL_NEW'
      })
      .promise()

    console.log(result)

    const attributes = result.Attributes

    return attributes as TodoUpdate
  }

  async deleteToDoItem(todoId: string, userId: string): Promise<string> {
    console.log('Deleting todo')

    const result = await this.docClient
      .delete({
        TableName: this.todoTable,
        Key: {
          userId: userId,
          todoId: todoId
        }
      })
      .promise()

    console.log(result)

    return ''
  }
   async generateUploadUrl(todoId: string): Promise<string> {
        console.log("Generating URL");

        const url = this.s3Client.getSignedUrl('putObject', {
            Bucket: this.s3BucketName,
            Key: todoId,
            Expires: 1000,
        });
        console.log(url);

        return url as string;
    }
}