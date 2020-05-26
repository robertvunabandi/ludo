#!/usr/bin/env python3
import argparse
import os
import re
import sys

IMPORTS = """import React from "react"
import PropTypes from "prop-types"
"""

INITIAL_EXPORT = "export default class <COMPONENT-NAME> extends React.Component {"
INDENT = "    "
PROP_TYPES_START = "  static propTypes = {"
PROP_TYPES_END = "}"
DEFAULT_PROPS_START = "  static defaultProps = {"
DEFAULT_PROPS_END = "}"
REST = """
  constructor(props) {
    super(props)
  }

  render() {
    return <<COMPONENT-NAME>View {...this.state} />
  }
}

function <COMPONENT-NAME>View(props) {
  return (
    <span>
    </span>
  )
}

"""
COMPONENT_NAME_HINT = "<COMPONENT-NAME>"


def is_valid_react_component_name(cname):
    return re.fullmatch(r"([A-Z]([a-z0-9])*)+", cname) is not None

def parse_fields(fields):
    parsed_fields = []
    for field in fields:
        is_required = field[-1] == "."
        if is_required:
            field = field[:-1]
        values = field.split(":")
        ftype, fdefault = "PropTypes.string", "null"
        field, *rest = values
        if len(rest) >= 1:
            ftype = "PropTypes." + rest[0]
        ftype = ftype + (".isRequired" if is_required else "")
        if len(rest) == 2:
            fdefault = rest[1]
        parsed_fields.append((field, ftype, fdefault))

    return parsed_fields


def add_react_lines_to_file(cname, parsed_fields):
    with open(cname + ".jsx", "w") as f:
        for line in IMPORTS.splitlines():
            f.write(line + "\n")
        f.write("\n\n" + INITIAL_EXPORT.replace(COMPONENT_NAME_HINT, cname) + "\n")

        f.write(PROP_TYPES_START)
        if len(parsed_fields) != 0:
            f.write("\n")
            for field, ftype, _ in parsed_fields:
                f.write(INDENT + f"{field}: {ftype},\n")
            f.write("  " + PROP_TYPES_END + "\n\n")
        else:
            f.write(PROP_TYPES_END + "\n\n")

        f.write(DEFAULT_PROPS_START)
        if len(parsed_fields) != 0:
            f.write("\n")
            for field, _, fdefault in parsed_fields:
                f.write(INDENT + f"{field}: {fdefault},\n")
            f.write("  " + DEFAULT_PROPS_END + "\n")
        else:
            f.write(DEFAULT_PROPS_END + "\n")

        for line in REST.splitlines():
            f.write(line.replace(COMPONENT_NAME_HINT, cname) + "\n")


def run_make_component(cname, parsed_fields):
    if not is_valid_react_component_name(cname):
        print(
            f"The given component name ({cname}) is invalid. Please use "
            "CamelCase with uppercase first letter."
        )
        return 1
    if os.path.exists(cname + ".jsx"):
        print(
            f"The given component name ({cname}) may already exists "
            "because a `.jsx` file with this name was found. "
            "Please use a different name."
        )
        return 1

    add_react_lines_to_file(cname, parsed_fields)
    return 0


if __name__ == "__main__":
    DESCRIPTION = """
    This files helps generate new React components files
    """
    parser = argparse.ArgumentParser(description=DESCRIPTION)
    parser.add_argument(
        "component",
        metavar="COMPONENT-NAME",
        type=str,
        help="The name of your new react component",
    )
    parser.add_argument(
        "fields",
        metavar="FIELDS",
        nargs="*",
        type=str,
        help=(
            "Fields in the component. Write them in the following "
            "format. `field` for a given field. The types will default "
            "to `PropTypes.string`, which you can change later. If you want "
            "a primitive type (array, bool, func, number, object, string, "
            "symbol), use `field:type`. To add a default value, do this: "
            "`field:type:default`. To make a field required, add a `.` "
            "at the end of the field, like `field.` or `field:type.` or "
            "`field:type:default.` NOTE that a type must be provided in "
            "order to have a default value."
        ),
    )
    args = parser.parse_args()
    cname = args.component
    fields = args.fields
    parsed_fields = parse_fields(fields)
    sys.exit(run_make_component(cname, parsed_fields))

