import Joi from 'joi'
import RE2 from 're2'
import { BaseService, InvalidParameter, queryParams } from '../index.js'
import { url } from '../validators.js'
import { renderDynamicBadge } from '../dynamic-common.js'

export default class DynamicRegex extends BaseService {
  static category = 'dynamic'
  static route = {
    base: `badge/dynamic/regex`,
    pattern: '',
    queryParamSchema: Joi.object({
      url,
      search: Joi.string().required(),
      replace: Joi.string().optional(),
      flags: Joi.string().optional(),
      noMatch: Joi.string().optional(),
    }),
  }
  static openApi = {
    '/badge/dynamic/regex': {
      get: {
        summary: 'Dynamic Regex (re2) Badge [Experimental]',
        description:
          '⚠️ Experimental: This badge is considered experimental and may change or be removed at any time.\n\nThis badge will extract text from a file using re2 (a subset of regex: https://github.com/google/re2).\nThe main use-case is to extract values from unsupported plain-text files.\nFor example: if a file contains a line like `version - 2.4` you can extract the value `2.4` by using a search regex of `version - (.*)` and `$1` as replacement.\n\nFull Syntax documentation here: https://github.com/google/re2/wiki/Syntax',
        parameters: queryParams(
          {
            name: 'url',
            description:
              'The URL to a file to search. The full raw content will be used as the search string.',
            required: true,
            example:
              'https://raw.githubusercontent.com/badges/shields/refs/heads/master/README.md',
          },
          {
            name: 'search',
            description:
              'A re2 expression that will be used to extract data from the document. Only the first matched text will be returned.',
            required: true,
            example: 'Every month it serves (.*?) images',
          },
          {
            name: 'replace',
            description:
              'A regex expression that will be used as the replacement of the search regex, like `$1` to specify the first matched group, etc. If empty (default), no replacement will be done and the full matched text will be shown.',
            required: false,
            example: '$1',
          },
          {
            name: 'flags',
            description:
              'Flags to be used when creating the regex, like `i` for case insensitive, or `m` for multiline. None by default.',
            required: false,
            example: 'imsU',
          },
          {
            name: 'noMatch',
            description:
              'String to be returned if the regex does not match the input. Empty by default.',
            required: false,
          },
        ),
      },
    },
  }
  static defaultBadgeData = { label: 'match' }

  async handle(namedParams, { url, search, replace, flags, noMatch = '' }) {
    // fetch file
    const { buffer } = await this._request({ url })

    // build re2 regex
    let re2
    try {
      re2 = new RE2(search, flags)
    } catch (e) {
      throw new InvalidParameter({
        prettyMessage: `Invalid re2 regex: ${e.message}`,
      })
    }

    // extract value
    const found = re2.exec(buffer)

    let value
    if (found == null) {
      // not found, use noMatch
      value = noMatch
    } else if (replace === undefined) {
      // found but no replacement specified, use full string
      value = found[0]
    } else {
      // found and replacement specified, convert
      value = found[0].replace(re2, replace)
    }

    return renderDynamicBadge({ value })
  }
}
