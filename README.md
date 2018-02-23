# qcloud-apigateway

Qcloud API Gateway api

_Undocumented apis spy from [qcloud web console](https://console.qcloud.com/apigateway)_

[![Build Status](https://travis-ci.org/vitarn/qcloud-apigateway.svg?branch=master)](https://travis-ci.org/vitarn/qcloud-apigateway)

## Usage

`npm i qcloud-apigateway`

```js
const { QcloudAPIGateway } = require('qcloud-apigateway')
const ag = new QcloudAPIGateway({SecretId: 'xxx', SecretKey: 'xxx', Region: 'sh'})

ag.describeServicesStatus().then(console.log)

/*
{ totalCount: 1,
  serviceStatusSet:
   [ { serviceDesc: 'API Gateway example.',
       protocol: 'http&https',
       modifiedTime: '2018-02-05 21:48:41',
       serviceId: 'service-0abc0def',
       availableEnvironments: [],
       serviceName: 'demo',
       createdTime: '2018-02-05 21:48:41',
       subDomain: 'service-0abc0def-1257654321.ap-shanghai.apigateway.myqcloud.com' } ] }
*/
```

## API

|   | FIELD | TYPE | DESCRIPTION | REMARK |
| - | ---   | ---  | ---         | ---    |
|
| **#createService** |
|   | ***protocol** | `http | https | http&https` | |
|   | serviceName | `string` | Service name is **NOT** unique. If leave blank server will generate a random one. | max 50, a-z, A-Z, 0-9, _ |
|   | serviceDesc | `string` |
|
| **#describeServicesStatus** |
|   | limit | `number` | | 0 - 100 |
|   | offset | `number` | | 0 - INFINITY |
|   | searchId | `string` | Search by service id. | Starts with `service-` |
|   | searchName | `string` | Search by service name. | Starts with `service-` |
| _@return_ |
|   | totalCount | `number` |
|   | serviceStatusSet | `[]` |
|   | serviceStatusSet[].serviceId | `string` |
|   | serviceStatusSet[].serviceName | `string` |
|   | serviceStatusSet[].serviceDesc | `string` |
|   | serviceStatusSet[].protocol | `http | https | http&https` |
|   | serviceStatusSet[].subDomain | `string` |
|   | serviceStatusSet[].vailableEnvironments | `[]` |
|
