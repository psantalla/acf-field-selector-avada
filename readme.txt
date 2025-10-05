=== ACF Field Selector for Avada ===
Contributors: pablosantalla
Tags: acf, avada, fusion builder, custom fields, dynamic content
Requires at least: 5.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Searchable ACF field selector for Fusion Builder dynamic content fields.

== Description ==

Adds searchable dropdown selectors to Fusion Builder ACF field inputs. Fields are organized by group with type indicators for easy selection.

**Features**

* Search and filter ACF fields
* Grouped by field groups
* Type indicators (text, image, repeater, etc.)
* Support for nested fields and groups
* Cached for performance

**Compatibility**

* Works with Fusion Builder backend editor
* Untested with Avada Live frontend editor

**Field Mapping**

* `custom_field_name` - All fields except repeaters
* `acf_repeater_field` - Repeater fields only
* `acf_relationship_field` - Relationship fields only
* `sub_field` - Repeater sub-fields

== Requirements ==

* Advanced Custom Fields (Free or Pro)
* Fusion Builder (Avada theme)

Works with both ACF Free and ACF Pro. Additional field types available with Pro version (repeaters, galleries, flexible content).

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu
3. Selectors appear automatically in Fusion Builder backend editor

== Frequently Asked Questions ==

= Does this work without ACF Pro? =

Yes. Works with both ACF Free and ACF Pro.

= Does this work with Avada Live? =

Not tested. Designed for backend Fusion Builder only.

= Where do the selectors appear? =

Next to ACF field inputs in Fusion Builder's dynamic content options.

== Screenshots ==

1. Field selector dropdown in Fusion Builder
2. Search and filter fields by name or type

== Changelog ==

= 1.0.0 =
* Initial release