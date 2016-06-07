import { ReactionProduct } from "/lib/api";

/**
 * metaComponent helpers
 */

Template.metaComponent.helpers({
  buttonProps() {
    const currentData = Template.currentData();

    return {
      icon() {
        if (currentData.createNew) {
          return "plus";
        }

        return "times-circle";
      },
      onClick() {
        if (!currentData.createNew) {
          const productId = ReactionProduct.selectedProductId();
          Meteor.call("products/removeMetaFields", productId, currentData);
        }
      }
    };
  }
});


Template.metaComponent.events({
  "change input": function (event) {
    const updateMeta = {
      key: $(event.currentTarget).parent().children(
        ".metafield-key-input").val(),
      value: $(event.currentTarget).parent().children(
        ".metafield-value-input").val()
    };
    if (this.key) {
      const productId = ReactionProduct.selectedProductId();
      Meteor.call("products/updateMetaFields", productId, updateMeta,
        this);
      $(event.currentTarget).animate({
        backgroundColor: "#e2f2e2"
      }).animate({
        backgroundColor: "#fff"
      });
      return Tracker.flush();
    }

    if (updateMeta.value && !updateMeta.key) {
      $(event.currentTarget).parent().children(".metafield-key-input").val(
        "").focus();
    }
    if (updateMeta.key && updateMeta.value) {
      Meteor.call("products/updateMetaFields", this._id, updateMeta);
      Tracker.flush();
      $(event.currentTarget).parent().children(".metafield-key-input").val(
        "").focus();
      return $(event.currentTarget).parent().children(
        ".metafield-value-input").val("");
    }
  }
});
