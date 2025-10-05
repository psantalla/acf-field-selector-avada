=== ACF Field Selector for Avada ===
Contributors: psantalla
Tags: acf, avada, fusion builder, custom fields, dynamic content
Requires at least: 5.0
Tested up to: 6.7.1
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Searchable ACF field selector for Fusion Builder dynamic content fields.

== Description ==

Simplifies working with ACF fields in Avada's Fusion Builder by adding dropdown selectors with search functionality. Fields are organized by field groups with type indicators.

**Features**

* Search and filter ACF fields by name or label
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

1. ACF fields loaded for easy integration
2. Adaptive search based on field type

== Changelog ==

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.0.0 =
Initial release.