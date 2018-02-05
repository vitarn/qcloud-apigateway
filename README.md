# qcloud-apigateway
Qcloud API Gateway api (private)

`npm i qcloud-apigateway`

```js
const QcloudAPIGateway = require('qcloud-apigateway')
const ag = new QcloudAPIGateway({SecretId: 'xxx', SecretKey: 'xxx', Region: 'sh'})

ag.describeServicesStatus().then(console.log)

/*
null { totalCount: 1,
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
