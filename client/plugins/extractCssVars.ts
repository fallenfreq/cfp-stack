import fs from 'fs'
import safe from 'postcss-safe-parser'
import postcss from 'postcss'

type Variables = Record<string, string>

const extraxtVars = (selector: string, cssAst: postcss.Result<postcss.Root>) => {
  const variables: Variables = {}
  cssAst.root.walkRules(selector, (rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) {
        variables[decl.prop] = decl.value
      }
    })
  })
  return variables
}

// Function to resolve the value of a variable
const resolveVar = (variables: Variables, varName: string, lookupVariables: Variables) => {
  let value = variables[varName]
  while (value && value.startsWith('var(')) {
    const referencedVar = value.match(/var\((--[^)]+)\)/)?.[1] || ''
    value = lookupVariables[referencedVar] || referencedVar
  }
  return value
}

// Resolve all variables in an object
const resolveAllVars = (variables: Variables, lookupVariables: Variables) => {
  const resolvedVars: Variables = {}
  for (const key of Object.keys(variables)) {
    resolvedVars[key] = resolveVar(variables, key, lookupVariables)
  }
  return resolvedVars
}

const run = async (cssFilePath: string, saveLocation: string) => {
  const cssString = await fs.readFileSync(cssFilePath)
  const cssAst = await postcss().process(cssString, {
    from: cssFilePath,
    parser: safe
  })
  const darkVariables = extraxtVars('.dark', cssAst)
  const rootVariables = extraxtVars(':root', cssAst)
  const pinkVariables = extraxtVars('.pink', cssAst)

  const jsonContent = {
    root: resolveAllVars(rootVariables, rootVariables),
    dark: resolveAllVars(darkVariables, { ...rootVariables, ...darkVariables }),
    pink: resolveAllVars(pinkVariables, { ...rootVariables, ...pinkVariables })
  }

  fs.writeFileSync(
    saveLocation + '.js',
    '// This file is generated by extractCssVars.ts' +
      '\n\n' +
      'export default ' +
      JSON.stringify(jsonContent, null, 2)
  )
}

export default run
