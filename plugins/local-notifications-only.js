// Crohnic only schedules local notifications. expo-notifications adds the push
// entitlement by default, which would force a new provisioning profile with the
// Push Notifications capability. Drop it so CI builds keep working unattended.
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withLocalNotificationsOnly(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
};
