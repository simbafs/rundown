/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3963244867")

  // update collection data
  unmarshal({
    "listRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3963244867")

  // update collection data
  unmarshal({
    "listRule": "owner.id = @request.auth.id || member.id ?= @request.auth.id",
    "viewRule": "owner.id = @request.auth.id || member.id ?= @request.auth.id"
  }, collection)

  return app.save(collection)
})
