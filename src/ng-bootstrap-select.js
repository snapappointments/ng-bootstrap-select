'use strict';

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

function sortedKeys(obj) {
  var keys = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
    }
  }
  return keys.sort();
}

function selectpickerDirective($parse, $timeout) {
  return {
    restrict: 'A',
    priority: 1000,
    link: function (scope, element, attrs) {
      var $async = scope.$applyAsync ? '$applyAsync' : '$evalAsync', // fall back to $evalAsync if using AngularJS v1.2.x
          NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/,
          multiple = attrs.multiple,
          optionsExp = attrs.ngOptions,
          optionAttrs = $parse(attrs.bsOptionAttrs)(scope),
          nullOption,
          match = optionsExp.match(NG_OPTIONS_REGEXP),
          displayFn = $parse(match[2] || match[1]),
          valueName = match[4] || match[6],
          keyName = match[5],
          collection = match[7],
          valuesFn = $parse(collection);

      function bindData(text) {
        var startIndex,
            endIndex,
            index = 0,
            expressions = [],
            parseFns = [],
            textLength = text ? text.length : 0,
            exp,
            concat = [],
            startSymbol = '{{',
            endSymbol = '}}',
            startSymbolLength = startSymbol.length,
            endSymbolLength = endSymbol.length,
            escapedStartRegexp = new RegExp(startSymbol.replace(/./g, escape), 'g'),
            escapedEndRegexp = new RegExp(endSymbol.replace(/./g, escape), 'g'),
            expressionPositions = [];
            
        function escape(ch) {
          return '\\\\\\' + ch;
        }
      
        function unescapeText(text) {
          return text.replace(escapedStartRegexp, startSymbol).
            replace(escapedEndRegexp, endSymbol);
        }
            
        while (index < textLength) {
          if (((startIndex = text.indexOf(startSymbol, index)) != -1) &&
               ((endIndex = text.indexOf(endSymbol, startIndex + startSymbolLength)) != -1)) {
            if (index !== startIndex) {
              concat.push(unescapeText(text.substring(index, startIndex)));
            }
            exp = text.substring(startIndex + startSymbolLength, endIndex);
            expressions.push(exp);
            index = endIndex + endSymbolLength;
            expressionPositions.push(concat.length);
            concat.push('');
          } else {
            // we did not find an interpolation, so we have to add the remainder to the separators array
            if (index !== textLength) {
              concat.push(unescapeText(text.substring(index)));
            }
            break;
          }
        }
        
        return function(context, locals) {
          for (var i = 0, ii = expressions.length; i < ii; i++) {
            concat[expressionPositions[i]] = $parse(expressions[i])(context, locals);
          }
          
          return concat.join('');
        }
      }

      function setAttributes() {
        var locals = {},
            getLocals = keyName ? function(value, key) {
              locals[keyName] = key;
              locals[valueName] = value;
              return locals;
            } : function(value) {
              locals[valueName] = value;
              return locals;
            };

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
              newData = {},
              key = keys[i],
              customAttrs = typeof optionAttrs === 'function' ? optionAttrs(key, values[key]) : optionAttrs;
          
          locals = getLocals(values[key], key);
          
          if (key) {
            for (var optionAttr in customAttrs) {
              var attr = customAttrs[optionAttr],
                  dataAttr = optionAttr.split('data-')[1] ? optionAttr.split('data-')[1].replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); }) : null, // convert to camelCase
                  parseAttr = bindData(attr)(scope, locals);
              
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

      if (attrs.ngModel) {
        scope.$watch(attrs.ngModel, function(newVal, oldVal) {
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
