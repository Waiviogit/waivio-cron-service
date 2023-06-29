exports.FEE = {
  minimumValue: 1,
  currency: 'HBD',
  perUser: 0.005,
  account: 'waivio.web',
  id: JSON.stringify({ id: this.TRANSFER_ID }),
  perInactive: 0.2,
};

exports.STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
};

exports.TEST_DOMAINS = [
  'dinings.pp.ua',
  'dinings.club',
  'dining.pp.ua',
  'socialgifts.pp.ua',
];

exports.PAYMENT_DESCRIPTION = {
  HOSTING_FEE: 'hosting fee',
  RESERVATION: 'reservation',
};
