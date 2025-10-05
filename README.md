# ACF Field Selector for Avada

Adds searchable ACF field selectors to Fusion Builder's dynamic content fields.

## Description

Simplifies working with ACF fields in Avada's Fusion Builder by adding dropdown selectors with search functionality. Fields are organized by field groups with type indicators.

## Features

- Search and filter ACF fields by name or label
- Grouped by ACF field groups
- Type indicators (text, image, repeater, etc.)
- Support for nested fields and groups
- Cached for performance
- Works with both ACF Free and ACF Pro

## Requirements

- WordPress 5.0+
- PHP 7.4+
- Advanced Custom Fields (Free or Pro)
- Avada theme with Fusion Builder

## Installation

1. Download the plugin
2. Upload to `/wp-content/plugins/`
3. Activate through WordPress admin
4. Selectors appear automatically in Fusion Builder backend editor

## Field Mapping

The plugin detects field types automatically:

- `custom_field_name` - All fields except repeaters
- `acf_repeater_field` - Repeater fields only
- `acf_relationship_field` - Relationship fields only
- `sub_field` - Repeater sub-fields

## Compatibility

- Works with Fusion Builder backend editor
- Untested with Avada Live frontend editor
- Supports ACF 5.0+

## Development

Built with vanilla JavaScript ES6. No dependencies.

```bash
# Clone repo
git clone https://github.com/psantalla/acf-field-selector-avada.git

# Structure
acf-field-selector-avada/
├── acf-field-selector-for-avada.php
├── assets/
│   ├── selector.js
│   └── selector.css
└── readme.txt
```

## License

GPL-2.0-or-later

## Author

Pablo Santalla  
[pablosantalla.com](https://pablosantalla.com/)