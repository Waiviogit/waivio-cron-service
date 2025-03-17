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

exports.NOTIFICATION = {
  WARNING: 'Warning: website account balance may run out in',
  ATTENTION: 'Attention! All your websites are now suspended due to the negative balance on your website account',
  BALANCE_ID: 'webSiteBalance',
  SUSPENDED: 'website_account_suspended',
  OUT_THREE_MONTHS: 'balance_run_out_three_months',
  OUT_TWO_MONTHS: 'balance_run_out_two_months',
  OUT_MONTH: 'balance_run_out_month',
  OUT_THREE_WEEKS: 'balance_run_out_three_weeks',
  OUT_TWO_WEEKS: 'balance_run_out_two_weeks',
  OUT_WEEK: 'balance_run_out_week',
  OUT_SIX_DAYS: 'balance_run_out_six_days',
  OUT_FIVE_DAYS: 'balance_run_out_five_days',
  OUT_FOUR_DAYS: 'balance_run_out_four_days',
  OUT_THREE_DAYS: 'balance_run_out_three_days',
  OUT_TWO_DAYS: 'balance_run_out_two_days',
  OUT_DAY: 'balance_run_out_day',
};

exports.PAYMENT_TYPES = {
  TRANSFER: 'transfer',
  WRITE_OFF: 'writeOff',
  REFUND: 'refund',
  CREDIT: 'credit', // special type admin can give credits to site
};

exports.INACTIVE_STATUSES = [
  this.STATUSES.SUSPENDED,
  this.STATUSES.INACTIVE,
  this.STATUSES.PENDING,
];

exports.BILLING_TYPE = {
  CRYPTO: 'crypto',
  PAYPAL_SUBSCRIPTION: 'paypal_subscription',
};
