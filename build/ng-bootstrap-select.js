/*!
 * ng-bootstrap-select v0.2.0
 *
 * Licensed under MIT
 */

'use strict';

/**
 * @ngdoc module
 * @name ng-bootstrap-select.extra
 * @description
 * ng-bootstrap-select extra.
 */

angular.module('ng-bootstrap-select.extra', [])
  .directive('dropdownToggle', [dropdownToggleDirective])
  .directive('dropdownClose', [dropdownCloseDirective]);

/**
 * @ngdoc directive
 * @name dropdownToggle
 * @restrict ACE
 *
 * @description
 * This extra directive provide dropdown toggle specifically to bootstrap-select without loading bootstrap.js.
 *
 * @usage
 * ```html
 * <div class="dropdown-toggle">
 *   <select class="selectpicker">
 *      <option value="">Select one</option>
 *      <option>Mustard</option>
 *      <option>Ketchup</option>
 *      <option>Relish</option>
 *   </select>
 * </div>
 *
 * <div dropdown-toggle>
 *   <select class="selectpicker">
 *      <option value="">Select one</option>
 *      <option>Mustard</option>
 *      <option>Ketchup</option>
 *      <option>Relish</option>
 *   </select>
 * </div>
 *
 * <dropdown-toggle>
 *   <select class="selectpicker">
 *      <option value="">Select one</option>
 *      <option>Mustard</option>
 *      <option>Ketchup</option>
 *      <option>Relish</option>
 *   </select>
 * </dropdown-toggle>
 * ```
 */

function dropdownToggleDirective() {
  return {
    restrict: 'ACE',
    priority: 101,
    link: function (scope, element, attrs) {
      var toggleFn = function (e) {
        var parent = angular.element(this).parent();

        angular.element('.bootstrap-select.open', element)
          .not(parent)
          .removeClass('open');

        parent.toggleClass('open');
      };

      element.on('click.bootstrapSelect', '.dropdown-toggle', toggleFn);

      scope.$on('$destroy', function () {
        element.off('.bootstrapSelect');
      });
    }
  };
}

/**
 * @ngdoc directive
 * @name dropdownClear
 * @restrict ACE
 *
 * @description
 * This extra directive provide the closing of ALL open dropdowns clicking away
 *
 * @usage
 * ```html
 * <div class="dropdown-close">
 *   <select class="selectpicker">
 *      <option value="">Select one</option>
 *      <option>Mustard</option>
 *      <option>Ketchup</option>
 *      <option>Relish</option>
 *   </select>
 * </div>
 *
 * <div dropdown-close>
 *   <select class="selectpicker">
 *      <option value="">Select one</option>
 *      <option>Mustard</option>
 *      <option>Ketchup</option>
 *      <option>Relish</option>
 *   </select>
 * </div>
 *
 * <dropdown-close>
 *   <select class="selectpicker">
 *      <option value="">Select one</option>
 *      <option>Mustard</option>
 *      <option>Ketchup</option>
 *      <option>Relish</option>
 *   </select>
 * </dropdown-close>
 * ```
 */

function dropdownCloseDirective() {
  return {
    restrict: 'ACE',
    priority: 101,
    link: function (scope, element, attrs) {
      var hideFn = function (e) {
        var parent = e.target.tagName !== 'A' && angular.element(e.target).parents('.bootstrap-select');

        angular.element('.bootstrap-select.open', element)
          .not(parent)
          .removeClass('open');
      };

      angular.element(document).on('click.bootstrapSelect', hideFn);

      scope.$on('$destroy', function () {
        angular.element(document).off('.bootstrapSelect');
      });
    }
  };
}

/**
 * @ngdoc module
 * @name ng-bootstrap-select
 * @description
 * ng-bootstrap-select.
 */

angular.module('ng-bootstrap-select', [])
  .directive('selectpicker', ['$parse', '$timeout', selectpickerDirective]);

/**
 * @ngdoc directive
 * @name selectpicker
 * @restrict A
 *
 * @param {object} selectpicker Directive attribute to configure bootstrap-select, full configurable params can be found in [bootstrap-select docs](http://silviomoreto.github.io/bootstrap-select/).
 * @param {string} ngModel Assignable angular expression to data-bind to.
 *
 * @description
 * The selectpicker directive is used to wrap bootstrap-select.
 *
 * @usage
 * ```html
 * <select selectpicker ng-model="model">
 *   <option value="">Select one</option>
 *   <option>Mustard</option>
 *   <option>Ketchup</option>
 *   <option>Relish</option>
 * </select>
 *
 * <select selectpicker="{dropupAuto:false}" ng-model="model">
 *   <option value="">Select one</option>
 *   <option>Mustard</option>
 *   <option>Ketchup</option>
 *   <option>Relish</option>
 * </select>
 * ```
 */

function selectpickerDirective($parse, $timeout) {
  return {
    restrict: 'A',
    priority: 1000,
    link: function (scope, element, attrs) {
      var $async = scope.$applyAsync ? '$applyAsync' : '$evalAsync', // fall back to $evalAsync if using AngularJS v1.2.x
          NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/,
          multiple = attrs.multiple,
          optionsExp = attrs.ngOptions,
          optionAttrs = $parse(attrs.bsOptionAttrs)(),
          nullOption,
          match = optionsExp.match(NG_OPTIONS_REGEXP),
          displayFn = $parse(match[2] || match[1]),
          valueName = match[4] || match[6],
          keyName = match[5],
          collection = match[7],
          valuesFn = $parse(collection);

      function setAttributes() {
        if ($.isEmptyObject(optionAttrs)) return;

        nullOption = false;

        // find "null" option
        for (var i = 0, children = element.find('option'), ii = children.length; i < ii; i++) {
          if (children[i].value === '') {
            nullOption = children.eq(i);
            break;
          }
        }
            
        var values = valuesFn(scope) || [],
            keys = angular.copy(keyName ? sortedKeys(values) : values);
            
        if (!multiple && nullOption) {
          // insert null option if we have a placeholder, or the model is null
          keys.unshift(null);
        }
        
        element.find('option').each(function(i) {
          var locals = {},
              newAttrs = {},
              newData = {};
          
          if (keys[i]) {
            
            locals[valueName] = keys[i];
            
            for (var optionAttr in optionAttrs) {
              var attr = optionAttrs[optionAttr],
                  dataAttr = optionAttr.split('data-')[1] ? optionAttr.split('data-')[1].replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); }) : null, // convert to camelCase
                  parseAttr = $parse(attr)(scope, locals);
              
              if (dataAttr) {  
                newData[dataAttr] = parseAttr || attr;
              } else {
                newAttrs[optionAttr] = parseAttr || attr;
              }
            }

            $(this).data(newData).attr(newAttrs);
          }
        });
      }

      function refresh(newVal) {
        scope[$async](function () {
          if (attrs.bsOptionAttrs) setAttributes();
          element.selectpicker('refresh');
        });
      }

      function render(newVal) {
        // update model if select is within child scope (e.g. inside ng-if)
        if (scope.$parent[attrs.ngModel] !== undefined && scope.$parent[attrs.ngModel] !== newVal) {
          scope.$parent[attrs.ngModel] = newVal;
        }
        
        if (scope.$$childHead && scope.$$childHead[attrs.ngModel]) {
          scope.$$childHead[attrs.ngModel] = newVal;
        }

        scope[$async](function () {
          element.selectpicker('render');
        });
      }

      attrs.$observe('spTheme', function (val) {
        $timeout(function () {
          element.data('selectpicker').$button.removeClass(function (i, c) {
            return (c.match(/(^|\s)?btn-\S+/g) || []).join(' ');
          });
          element.selectpicker('setStyle', val);
        });
      });

      scope[$async](function () {
        element.selectpicker($parse(attrs.selectpicker)());
      });

      if (optionsExp) {
        scope.$watch(collection, refresh, true);
      }

      if (attr.ngModel) {
        scope.$watch(attr.ngModel, function(newVal, oldVal) {
          if (newVal !== oldVal) {
            if (!oldVal) {
              return refresh(newVal);
            } else {
              return render(newVal);
            }
          }
        }, true);
      }

      if (attrs.ngDisabled) {
        scope.$watch(attrs.ngDisabled, refresh, true);
      }

      scope.$on('$destroy', function () {
        $timeout(function () {
          element.selectpicker('destroy');
        });
      });
    }
  };
}
