function modify(d){return d.data.account=[],d.data.event_list=[],d.data.preload=[],d.data.show=[],d.data.list=[],d}let body=$response.body;body=JSON.stringify(modify(JSON.parse(body)));$done({body:body});