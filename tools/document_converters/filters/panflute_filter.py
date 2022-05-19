import panflute as pf

def remove_children(elem, doc):
    if isinstance(elem, pf.Link):
        return []
    if isinstance(elem, pf.Emph):
        return []

def action(elem, doc):
    # remove 'share' from the title
    if isinstance(elem, pf.Str) and elem.text == "share":
        return pf.Str("")
    # remove 'toast' text
    if isinstance(elem, pf.Div) and elem.identifier == 'toast':
        return pf.Div(pf.RawBlock(""))
    # remove links and navs  
    if isinstance(elem, pf.Plain):
        return elem.walk(remove_children, doc)

def prepare(doc):
    pass

def finalize(doc):
    pass

def main(doc=None):
	return pf.run_filter(action, prepare=prepare, finalize=finalize, doc=doc)

if __name__ == '__main__':
    main()
