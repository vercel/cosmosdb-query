// Reference: https://docs.microsoft.com/en-us/azure/cosmos-db/sql-api-sql-query-reference

{
  const reserved = new Set([
    "SELECT",
    "FROM",
    "WHERE",
    "ORDER",
    "BY",
    "AS",
    "IN",
    "JOIN",
    "ASC",
    "DESC",
    "AND",
    "OR",
    "NOT"
  ])
}

select_query
  = select _ select:select_specification _
    from:(from _ v:from_specification { return v })? _
    where:(where _ v:filter_condition { return v })? _
    orderBy:(order _ by _ v:sort_specification { return v })? _
    {
      return {
        type: 'select_query',
        select,
        from,
        where,
        orderBy
      }
    }

select_specification
  = '*'
    {
      return {
        type: 'select_specification',
        '*': true
      }
    }
  / properties:object_property_list
    {
      return {
        type: 'select_specification',
        properties
      }
    }
  / "VALUE"i _ value:scalar_expression _ alias:((as)? _ v:identifier { return v })?
    {
      return {
        type: 'select_specification',
        value,
        alias
      }
    }

object_property_list
  = head:object_property
    tail:(_ "," _ v:object_property { return v })*
    {
      return {
        type: 'object_property_list',
        properties: [head, ...tail]
      }
    }

from_specification
  = source:from_source joins:(_ join _ v:from_source { return v })*
    {
      return {
        type: 'from_specification',
        source,
        joins
      }
    }

from_source
  = alias:identifier _ in _ expression:collection_expression
    {
      return {
        type: 'from_source',
        expression,
        alias,
        iteration: true
      }
    }
  / expression:collection_expression alias:((_ as)? _ v:identifier { return v })?
    {
      return {
        type: 'from_source',
        expression,
        alias
      }
    }

collection_expression
  = collection_member_expression
  / collection_primary_expression

filter_condition
  = condition:scalar_expression
    {
      return {
        type: 'filter_condition',
        condition
      }
    }

sort_specification
  = head:sort_expression tail:(_ "," _ v:sort_expression { return v })*
    {
      return {
        type: 'sort_specification',
        expressions: [head, ...tail]
      }
    }

sort_expression
  = expression:scalar_expression order:(_ v:(asc / desc) { return v })?
    {
      return {
        type: 'sort_expression',
        expression,
        order
      }
    }

scalar_expression
  = scalar_conditional_expression
  / scalar_binary_expression
  / scalar_unary_expression
  / scalar_member_expression
  / scalar_primary_expression

scalar_function_expression
  = "udf." identifier _ "(" _ (scalar_expression (_ "," _ scalar_expression))? _ ")"
  / identifier _ "(" _ (scalar_expression (_ "," _ scalar_expression))? _ ")"

scalar_object_expression
  = "{" _
    head:scalar_object_element_property
    tail:(_ "," _ v:scalar_object_element_property { return v })*
    _ "}"
    {
      return {
        type: "scalar_object_expression",
        properties: [head, ...tail]
      }
    }

scalar_array_expression
  = "[" _ head:scalar_expression tail:(_ "," _ v:scalar_expression { return v })? _ "]"
    {
      return {
        type: "scalar_array_expression",
        values: [head, ...tail]
      }
    }

constant
  = undefined_constant
  / null_constant
  / boolean_constant
  / number_constant
  / string_constant
  / array_constant
  / object_constant

undefined_constant
  = "undefined"
    { return { type: 'undefined_constant' } }

null_constant
  = "null"
    { return { type: 'null_constant' } }

boolean_constant
  = "false"
    {
      return {
        type: 'boolean_constant',
        value: false
      }
    }
  / "true"
    {
      return {
        type: 'boolean_constant',
        value: true
      }
    }

number_constant
  = "-"? hex:"0x"? [0-9]+ ("." [0-9]+)? {
    return {
      type: "number_constant",
      // FIXME: support hex with float?
      value: hex ? parseInt(text(), 16) : parseFloat(text())
    }
  }

string_constant
  = "\"" chars:double_string_character* "\""
    {
      return {
        type: "string_constant",
        value: chars.join("")
      }
    }
  / "'" chars:single_string_character* "'"
    {
      return {
        type: "string_constant",
        value: chars.join("")
      }
    }

array_constant
  = "[" _ head:constant tail:(_ "," _ v:constant { return v })? _ "]"
    {
      return {
        type: "array_constant",
        values: [head, ...tail]
      }
    }

object_constant
  = "{" _
    head:object_constant_property
    tail:(_ "," _ v:object_constant_property { return v })*
    _ "}"
    {
      return {
        type: "object_constant",
        properties: [head, ...tail]
      }
    }

// by us
_ = (whitespace / comment)*

whitespace
  = [ \t\n\r]

comment
  = "--" (![\n\r] source_character)*

select = "SELECT"i !identifier_start
from = "FROM"i !identifier_start
where = "WHERE"i !identifier_start
order = "ORDER"i !identifier_start
by = "BY"i !identifier_start
as = "AS"i !identifier_start
join = "JOIN"i !identifier_start
in = "IN"i !identifier_start
asc = "ASC"i !identifier_start { return "ASC" }
desc = "DESC"i !identifier_start { return "DESC" }
and = "AND"i !identifier_start { return "AND" }
or = "OR"i !identifier_start { return "OR" }
not = "NOT"i !identifier_start { return "NOT" }

identifier
  = name:(head:identifier_start tail:[a-zA-Z0-9_]* { return head + tail.join('') })
    !{ return reserved.has(name.toUpperCase()) }
    {
      return {
        type: 'identifier',
        name
      }
    }

identifier_start
  = [a-zA-Z_]

parameter_name
  = "@" identifier
    {
      return {
        type: 'parameter_name',
        name: text()
      }
    }

array_index
  = [0-9]+
    {
      return {
        type: 'number_constant',
        value: text()
      }
    }

unary_operator
  = "+"
  / "-"
  / "~"
  / not

binary_operator
  = "+"
  / "-"
  / "*"
  / "/"
  / "%"
  / "||"
  / "|"
  / "&"
  / "^"
  / "<>"
  / "<="
  / "<<"
  / "<"
  / ">="
  / ">>>"
  / ">>"
  / ">"
  / and
  / or
  / "="
  / "!="
  / "??"

double_string_character
  = !('"' / "\\") source_character { return text(); }
  / "\\" seq:escape_sequence { return seq }

single_string_character
  = !("'" / "\\") source_character { return text(); }
  / "\\" seq:escape_sequence { return seq }

source_character
  = .

escape_sequence
  = charactor_escape_sequence
  / unicode_escape_sequence

charactor_escape_sequence
  = single_escape_character
  / non_escape_character

single_escape_character
  = "'"
  / '"'
  / "\\"
  / "b" { return "\b" }
  / "f" { return "\f" }
  / "n" { return "\n" }
  / "r" { return "\r" }
  / "t" { return "\t" }

non_escape_character
  =  !(escape_character) source_character
     { return text() }

escape_character
  = single_escape_character
  / "u"

unicode_escape_sequence
  = "u" digits:$(hex_digit hex_digit hex_digit hex_digit)
    { return String.fromCharCode(parseInt(digits, 16)) }

hex_digit
  = [0-9a-f]i

object_property
  = property:scalar_expression alias:((_ as)? _ v:identifier { return v })?
    { return { property, alias } }

scalar_primary_expression
  = constant
  / identifier
  / parameter_name
  / scalar_function_expression
  / scalar_object_expression
  / scalar_array_expression
  / "(" _ expression:scalar_expression _ ")"
    { return expression }

scalar_member_expression
  = head:scalar_primary_expression
    tail:(
      _ "." _ property:identifier _
      { return { property, computed: false } }
    / _ "[" _ property:(string_constant / array_index / parameter_name) _ "]"
      { return { property, computed: true } }
    )+
    {
      return tail.reduce((object, { property, computed }) => ({
        type: 'scalar_member_expression',
        object,
        property,
        computed
      }), head)
    }

scalar_unary_expression
  = operator:unary_operator _ argument:(scalar_member_expression / scalar_primary_expression)
    {
      return {
        type: 'scalar_unary_expression',
        operator,
        argument
      }
    }

scalar_binary_expression
  = head:(scalar_unary_expression / scalar_member_expression / scalar_primary_expression)
    tail:(
      _ operator:binary_operator _ right:(scalar_unary_expression / scalar_member_expression / scalar_primary_expression)
      { return { operator, right } }
    )+
    {
      return tail.reduce((left, { operator, right }) => ({
        type: 'scalar_binary_expression',
        left,
        operator,
        right
      }), head)
    }

scalar_conditional_expression
  = test:(scalar_binary_expression / scalar_unary_expression / scalar_member_expression / scalar_primary_expression) _ "?" _
    consequent:(scalar_binary_expression / scalar_unary_expression / scalar_member_expression / scalar_primary_expression) _ ":" _
    alternate:(scalar_binary_expression / scalar_unary_expression / scalar_member_expression / scalar_primary_expression)
    {
      return {
        type: 'scalar_conditional_expression',
        test,
        consequent,
        alternate
      }
    }

scalar_object_element_property
  = key:(identifier / string_constant) _ ":" _ value:scalar_expression
    { return { key, value } }

object_constant_property
  = key:(identifier / string_constant) _ ":" _ value:constant
    { return { key, value } }

collection_primary_expression
  = expression:identifier
    {
      return {
        type: 'collection_expression',
        expression
      }
    }

collection_member_expression
  = head:collection_primary_expression
    tail:(
      _ "." _ property:identifier _ { return { property, computed: false } }
    / _ "[" _ property:(string_constant / array_index / parameter_name) _ "]"  { return { property, computed: true } }
    )+
    {
      return tail.reduce((object, { property, computed }) => ({
        type: 'collection_member_expression',
        object,
        property,
        computed
      }), head)
    }
