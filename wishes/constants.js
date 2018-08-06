const listVisibleFields = [
  '_id',
  'title',
  'description',
  'link',
  'completed',
  'completedBy',
  'completedReason',
  'reserved',
  'reservedBy',
  'reservedByName',
  'price',
  'currency',
  '_creator',
  'creatorName'
].join(' ')

const bodyFields = [
  'title',
  'description',
  'link',
  'price',
  'currency'
]

module.exports.defaults = {
  listVisibleFields,
  bodyFields
}
