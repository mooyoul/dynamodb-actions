# dynamodb-actions

[![Build Status](https://github.com/mooyoul/dynamodb-actions/workflows/workflow/badge.svg)](https://github.com/mooyoul/dynamodb-actions/actions)
[![Example Status](https://github.com/mooyoul/dynamodb-actions/workflows/example/badge.svg)](https://github.com/mooyoul/dynamodb-actions/actions)
[![Semantic Release enabled](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)
[![MIT license](http://img.shields.io/badge/license-MIT-blue.svg)](http://mooyoul.mit-license.org/)

GitHub action that integrates with Amazon DynamoDB.

Inspired from [DynamoDB integration in AWS Step Functions](https://docs.aws.amazon.com/step-functions/latest/dg/connect-ddb.html)

-----

![Example](./assets/example.png)

## Supported Operations

### Get Item

Get Item from DynamoDB and Returns JSON-serialized Item payload.

##### Example

```yaml
# ...
jobs:
  job:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Get DynamoDB Item
        id: config
        uses: mooyoul/dynamodb-actions@v1.2.1
        env:
          AWS_DEFAULT_REGION: us-east-1
          AWS_REGION: us-east-1
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        with:
          operation: get
          region: us-east-1
          table: my-awesome-config
          key: |
            { key: "foo" }
      - name: Print item
        run: |
          echo '${{ steps.config.outputs.item }}'
      - name: Print specific field using built-in function
        run: |
          echo '${{ fromJson(steps.config.outputs.item).commit }}'
      - name: Print specific field using jq
        run: |
          jq '.commit' <<< '${{ steps.config.outputs.item }}'
```


##### Input

```typescript
type GetItemInput = {
  operation: "get";
  region: string;
  table: string;
  key: string; // JSON-serialized key
  consistent?: boolean;
}
```

##### Output

JSON-serialized item will be set to `item` output.

### Put Item

Put Item to DynamoDB

##### Example

with JSON input:

```yaml
# ...
jobs:
  job:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Put DynamoDB Item
        uses: mooyoul/dynamodb-actions@v1.2.1
        env:
          AWS_DEFAULT_REGION: us-east-1
          AWS_REGION: us-east-1
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        with:
          operation: put
          region: us-east-1
          table: my-awesome-config
          item: |
            { 
              key: "foo",
              value: "wow",
              awesome: true,
              stars: 12345
            }
```

with File input:


```yaml
# ...
jobs:
  job:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Put DynamoDB Item
        uses: mooyoul/dynamodb-actions@v1.2.1
        env:
          AWS_DEFAULT_REGION: us-east-1
          AWS_REGION: us-east-1
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        with:
          operation: put
          region: us-east-1
          table: my-awesome-config
          file: somewhere/filename.json
```


##### Input

```typescript
type PutItemInput = {
  operation: "put";
  region: string;
  table: string;
  item: string; // JSON-serialized item
} | {
  operation: "put";
  region: string;
  table: string;
  file: string; // JSON file path
};
```

##### Output

None.


### Batch Put Item

Batch Put Item to DynamoDB.

##### Example

with JSON input:

```yaml
# ...
jobs:
  job:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Put DynamoDB Item
        uses: mooyoul/dynamodb-actions@v1.2.1
        env:
          AWS_DEFAULT_REGION: us-east-1
          AWS_REGION: us-east-1
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        with:
          operation: batch-put
          region: us-east-1
          table: my-awesome-config
          items: |
            [{ 
              key: "foo",
              value: "wow",
              awesome: true,
              stars: 12345
            }, {
              key: "bar",
              value: "such",
              awesome: false,
              stars: 1
            }]
```

with File input (Glob):

> You can select multiple files by supplying Glob.
>
> For supported Glob patterns, Please refer to [@actions/glob README](https://github.com/actions/toolkit/tree/master/packages/glob#patterns).
  

```yaml
# ...
jobs:
  job:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Put DynamoDB Item
        uses: mooyoul/dynamodb-actions@v1.2.1
        env:
          AWS_DEFAULT_REGION: us-east-1
          AWS_REGION: us-east-1
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        with:
          operation: batch-put
          region: us-east-1
          table: my-awesome-config
          files: somewhere/prefix*.json
```


##### Input

```typescript
type BatchPutItemInput = {
  operation: "batch-put";
  region: string;
  table: string;
  items: string; // JSON-serialized item array
} | {
  operation: "put";
  region: string;
  table: string;
  files: string; // Glob to match JSON file paths
};
```

##### Output

None.


### Delete Item

Delete Item from DynamoDB

##### Example

```yaml
# ...
jobs:
  job:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Delete DynamoDB Item
        uses: mooyoul/dynamodb-actions@v1.2.1
        env:
          AWS_DEFAULT_REGION: us-east-1
          AWS_REGION: us-east-1
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        with:
          operation: delete
          region: us-east-1
          table: my-awesome-config
          key: |
            { key: "foo" }
```

##### Input

```typescript
type DeleteItemInput = {
  operation: "delete";
  region: string;
  table: string;
  key: string; // JSON-serialized key
}
```

##### Output

None

## FAQ

#### How to select specific field?

Use Github Actions built-in `fromJson` function.

For example:
```yaml
- name: Print specific field
  run: |
    echo '${{ fromJson(steps.[id].outputs.item).[field] }}'
```

Alternatively, You can also use [jq](https://stedolan.github.io/jq/). [Github-hosted runners already have pre-installed jq.](https://help.github.com/en/actions/reference/software-installed-on-github-hosted-runners)

For example:
```yaml
- name: Print specific field
  run: |
    jq '.field' <<< echo '${{ steps.[id].outputs.item }}'
``` 

## Wishlist

- Add UpdateItem operation
- Add conditional writes (e.g. putItem / updateItem)

## License

[MIT](LICENSE)

See full license on [mooyoul.mit-license.org](http://mooyoul.mit-license.org/)
