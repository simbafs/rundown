/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3963244867")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && @request.auth.verified = true",
    "deleteRule": "owner.id = @request.auth.id",
    "listRule": "owner.id = @request.auth.id || member.id ?= @request.auth.id",
    "updateRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id || member.id ?= @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3963244867")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
