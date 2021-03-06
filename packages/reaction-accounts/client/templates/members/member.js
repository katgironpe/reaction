const getPermissionMap = (permissions) => {
  const permissionMap = {};
  _.each(permissions, function (existing) {
    permissionMap[existing.permission] = existing.label;
  });
  return permissionMap;
};

/**
 * shopMember helpers
 * permissions / roles controls
 * we use userInRole instead of ReactionCore intentionally
 * to check each users permissions
 */
Template.member.events({
  "click [data-event-action=showMemberSettings]": function () {
    ReactionCore.showActionView({
      label: "Permissions",
      i18nKeyLabel: "admin.settings.permissionsSettingsLabel",
      data: this,
      template: "memberSettings"
    });
  }
});

Template.memberSettings.helpers({
  isOwnerDisabled: function () {
    if (Meteor.userId() === this.userId) {
      if (Roles.userIsInRole(this.userId, "owner", this.shopId)) {
        return true;
      }
    }
  },
  hasPermissionChecked: function (permission, userId) {
    if (userId && Roles.userIsInRole(userId, permission, this.shopId || Roles.userIsInRole(userId, permission,
        Roles.GLOBAL_GROUP))) {
      return "checked";
    }
  },
  groupsForUser: function (groupUserId) {
    let userId = groupUserId || this.userId || Template.parentData(1).userId;
    return Roles.getGroupsForUser(userId);
  },
  shopLabel: function (thisShopId) {
    const shopId = thisShopId || Template.currentData();
    let shop = ReactionCore.Collections.Shops.findOne({
      _id: shopId
    });
    if (shop && shop.name) {
      return shop.name;
    }
  },
  permissionGroups: function (thisShopId) {
    let permissionGroups = [];
    const shopId = thisShopId || Template.currentData();
    const packages = ReactionCore.Collections.Packages.find({
      shopId: shopId
    });

    packages.forEach(function (pkg) {
      const permissions = [];
      if (pkg.registry && pkg.enabled) {
        for (let registryItem of pkg.registry) {
          // Skip entires with missing routes
          if (!registryItem.route) {
            continue;
          }

          // Get all permissions, add them to an array
          if (registryItem.permissions) {
            for (let permission of registryItem.permissions) {
              permission.shopId = shopId;
              permissions.push(permission);
            }
          }

          // Also create an object map of those same permissions as above
          let permissionMap = getPermissionMap(permissions);
          if (!permissionMap[registryItem.route]) {
            permissions.push({
              shopId: pkg.shopId,
              permission: registryItem.name || pkg.name + "/" + registryItem.template, // launchdock-connect/connectDashboard
              icon: registryItem.icon,
              label: registryItem.label || registryItem.provides || registryItem.route
            });
          }
        }
        // todo review this, hardcoded WIP
        const label = pkg.name.replace("reaction", "").replace(/(-.)/g, function (x) {
          return " " + x[1].toUpperCase();
        });

        return permissionGroups.push({
          shopId: pkg.shopId,
          icon: pkg.icon,
          name: pkg.name,
          label: label,
          permissions: _.uniq(permissions)
        });
      }
    });

    return permissionGroups;
  },

  hasManyPermissions: function (permissions) {
    return Boolean(permissions.length);
  }
});

/**
 * shopMember events
 *
 */
Template.memberSettings.events({
  "change [data-event-action=toggleMemberPermission]": function (event, template) {
    const self = this;
    let permissions = [];
    const member = template.data;
    if (!this.shopId) {
      throw new Meteor.Error("Shop is required");
    }
    if (self.name) {
      permissions.push(self.name);
      for (let pkgPermissions of self.permissions) {
        permissions.push(pkgPermissions.permission);
      }
    } else {
      permissions.push(self.permission);
    }
    if ($(event.currentTarget).is(":checked")) {
      Meteor.call("accounts/addUserPermissions", member.userId, permissions, this.shopId);
    } else {
      Meteor.call("accounts/removeUserPermissions", member.userId, permissions, this.shopId);
    }
  },
  "click [data-event-action=resetMemberPermission]": function (event, template) {
    const $icon = $(event.currentTarget);
    if (confirm($icon.data("confirm"))) {
      const results = [];
      for (let role of template.data.roles) {
        results.push(Meteor.call("accounts/setUserPermissions", this.userId, ["guest", "account/profile"], role));
      }
      return results;
    }
  }
});
