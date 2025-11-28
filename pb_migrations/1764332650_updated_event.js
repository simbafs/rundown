/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4041782348")

  // update collection data
  unmarshal({
    "createRule": "activity.owner.id = @request.auth.id || activity.member.id ?= @request.auth.id",
    "deleteRule": "activity.owner.id = @request.auth.id || activity.member.id ?= @request.auth.id",
    "listRule": "",
    "updateRule": "activity.owner.id = @request.auth.id || activity.member.id ?= @request.auth.id",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4041782348")

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
