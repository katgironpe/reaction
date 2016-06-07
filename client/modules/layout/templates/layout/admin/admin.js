import { i18next } from "/client/modules/i18n";
import Drop from "tether-drop";
import { Reaction } from "/client/modules/core";
import { ReactionRouter } from "/client/modules/router";
import { Packages } from "/lib/collections";

Template.coreAdminLayout.onRendered(function () {
  $("body").addClass("admin");
});

Template.coreAdminLayout.onDestroyed(() => {
  $("body").removeClass("admin");
});

Template.coreAdminLayout.helpers({
  shortcutButtons() {
    const instance = Template.instance();
    const editModeIsEnabled = Session.equals("reaction/editModeEnabled", true);
    const shortcuts = Reaction.Apps({
      provides: "shortcut",
      enabled: true,
      container: undefined
    });

    let items = [];

    if (_.isArray(shortcuts)) {
      for (let shortcut of shortcuts) {
        items.push({
          type: "link",
          href: ReactionRouter.pathFor(shortcut.name),
          className: ReactionRouter.isActiveClassName(shortcut.name),
          icon: shortcut.icon,
          tooltip: shortcut.label || "",
          i18nKeyTooltip: shortcut.i18nKeyLabel,
          tooltipPosition: "left middle"
        });
      }
    }

    items.push({
      type: "seperator"
    });

    items.push({
      icon: "plus",
      tooltip: "Create Content",
      i18nKeyTooltip: "app.createContent",
      tooltipPosition: "left middle",
      onClick(event) {
        if (!instance.dropInstance) {
          instance.dropInstance = new Drop({
            target: event.currentTarget,
            content: "",
            constrainToWindow: true,
            classes: "drop-theme-arrows",
            position: "right center"
          });

          Blaze.renderWithData(Template.createContentMenu, {}, instance.dropInstance.content);
        }

        instance.dropInstance.open();
      }
    });

    items.push({
      icon: "edit",
      tooltip: "Toggle Edit Mode",
      i18nKeyTooltip: "app.toggleEditMode",
      tooltipPosition: "left middle",
      className: editModeIsEnabled ? "active" : "",
      onClick() {
        if (Session.equals("reaction/editModeEnabled", true)) {
          Session.set("reaction/editModeEnabled", false);
        } else {
          Session.set("reaction/editModeEnabled", true);
        }
      }
    });

    return items;
  },

  isSeperator(props) {
    if (props.type === "seperator") {
      return true;
    }
    return false;
  },

  packageButtons() {
    const routeName = ReactionRouter.getRouteName();

    if (routeName !== "dashboard") {
      const registryItems = Reaction.Apps({provides: "settings", container: routeName});
      let buttons = [];

      for (let item of registryItems) {
        if (Reaction.hasPermission(item.route, Meteor.userId())) {
          let icon = item.icon;

          if (!item.icon && item.provides === "settings") {
            icon = "gear";
          }

          buttons.push({
            href: item.route,
            icon: icon,
            tooltip: i18next.t(item.i18nKeyLabel, item.i18n),
            tooltipPosition: "left middle",
            onClick() {
              Reaction.showActionView(item);
            }
          });
        }
      }

      return buttons;
    }
  },

  control: function () {
    return Reaction.getActionView();
  },

  adminControlsClassname: function () {
    if (Reaction.isActionViewOpen()) {
      return "show-settings";
    }
    return "";
  },

  /**
   * thisApp
   * @return {Object} Registry entry for item
   */
  thisApp() {
    let reactionApp = Packages.findOne({
      "registry.provides": "settings",
      "registry.route": ReactionRouter.getRouteName()
    }, {
      enabled: 1,
      registry: 1,
      name: 1,
      route: 1
    });

    if (reactionApp) {
      let settingsData = _.find(reactionApp.registry, function (item) {
        return item.route === ReactionRouter.getRouteName() && item.provides === "settings";
      });

      return settingsData;
    }
    return reactionApp;
  }
});

// Template.coreAdminLayout.events({
//   /**
//    * Submit sign up form
//    * @param  {Event} event - jQuery Event
//    * @param  {Template} template - Blaze Template
//    * @return {void}
//    */
//   "click .admin-controls-quicklinks a, click .admin-controls-quicklinks button"(event) {
//     if (this.name === "createProduct") {
//       event.preventDefault();
//       event.stopPropagation();
//
//       if (!this.dropInstance) {
//         this.dropInstance = new Drop({
//           target: event.target,
//           content: "",
//           constrainToWindow: true,
//           classes: "drop-theme-arrows",
//           position: "right center"
//         });
//
//         Blaze.renderWithData(Template.createContentMenu, {}, this.dropInstance.content);
//       }
//
//       this.dropInstance.open();
//     } else if (this.route) {
//       event.preventDefault();
//       event.stopPropagation();
//
//       ReactionRouter.go(this.name);
//     }
//   }
// });
