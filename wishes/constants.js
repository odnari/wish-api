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
  'price',
  'currency'
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
