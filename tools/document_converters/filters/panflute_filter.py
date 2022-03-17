import panflute as pf

def action(elem, doc):
    # if isinstance(elem, pf.Plain):
    #     return pf.Plain(pf.Str(""))
    if isinstance(elem, pf.Div) and elem.identifier == 'toast':
        return pf.Div(pf.RawBlock(""))

def main(doc=None):
	return pf.run_filter(action, doc=doc)

if __name__ == '__main__':
    main()
