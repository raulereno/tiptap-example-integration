import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

/**
 * Highlights placeholders like `{{firstName}}` or `[amount]` with a soft
 * yellow background and dashed underline so users can spot them easily.
 */
export const VariableHighlightExtension = Extension.create({
  name: 'variableHighlight',

  // We inject a ProseMirror plugin that produces inline decorations
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('variableHighlight'),
        props: {
          decorations: ({ doc }) => {
            const decorations: Decoration[] = []
            const regex = /{{.*?}}|\[.*?]/g // matches {{any}} or [any]

            doc.descendants((node, pos) => {
              if (!node.isText) return
              let m: RegExpExecArray | null
              while ((m = regex.exec(node.text ?? '')) !== null) {
                const from = pos + m.index
                const to   = from + m[0].length
                decorations.push(
                  Decoration.inline(from, to, {
                    class: 'placeholder--highlight',
                  }),
                )
              }
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
}) 