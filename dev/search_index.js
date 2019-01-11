var documenterSearchIndex = {"docs": [

{
    "location": "#",
    "page": "Introduction",
    "title": "Introduction",
    "category": "page",
    "text": "CurrentModule=StringAnalysis"
},

{
    "location": "#Introduction-1",
    "page": "Introduction",
    "title": "Introduction",
    "category": "section",
    "text": "StringAnalysis is a package for working with strings and text. It is a hard-fork from TextAnalysis.jl designed to provide a more powerful, faster and orthogonal API."
},

{
    "location": "#What-is-new?-1",
    "page": "Introduction",
    "title": "What is new?",
    "category": "section",
    "text": "This package brings several changes over TextAnalysis.jl:Simpler API (less exported methods)\nImproved test coverage\nParametrized many of the objects i.e. DocumentTermMatrix, AbstractDocument etc\nExtended DocumentMetadata with new fields\nprepare function for preprocessing AbstractStrings\nMany of the repetitive functions are now automatically generated (see metadata.jl, preprocessing.jl)\nRe-factored the text preprocessing API\nImproved latent semantic analysis (LSA)\neach_dtv, each_hash_dtv iterators support vector element type specification\nAdded Okapi BM25 statistic\nMany bugfixes and small extensions"
},

{
    "location": "#Installation-1",
    "page": "Introduction",
    "title": "Installation",
    "category": "section",
    "text": "Installation can be performed from either inside or outside Julia."
},

{
    "location": "#Git-cloning-1",
    "page": "Introduction",
    "title": "Git cloning",
    "category": "section",
    "text": "The StringAnalysis repository can be downloaded through git:$ git clone https://github.com/zgornel/StringAnalysis.jl"
},

{
    "location": "#Julia-REPL-1",
    "page": "Introduction",
    "title": "Julia REPL",
    "category": "section",
    "text": "The package can be installed from inside Julia with:using Pkg\nPkg.add(StringAnalysis)will download the latest registered build of the package and add it to the current active development environment."
},

{
    "location": "examples/#",
    "page": "Usage examples",
    "title": "Usage examples",
    "category": "page",
    "text": ""
},

{
    "location": "examples/#Usage-examples-1",
    "page": "Usage examples",
    "title": "Usage examples",
    "category": "section",
    "text": ""
},

{
    "location": "examples/#Documents-1",
    "page": "Usage examples",
    "title": "Documents",
    "category": "section",
    "text": "Documents are simple wrappers around basic structures that contain text. The underlying data representation can be simple strings, dictionaries or vectors of strings. All document types are subtypes of the parametric type AbstractDocument{T} where T<:AbstractString.using StringAnalysis\n\nsd = StringDocument(\"this is a string document\")\nnd = NGramDocument(\"this is a ngram document\")\ntd = TokenDocument(\"this is a token document\")\n# fd = FileDocument(\"/some/file\") # works the same way ..."
},

{
    "location": "examples/#Documents-and-types-1",
    "page": "Usage examples",
    "title": "Documents and types",
    "category": "section",
    "text": "The string type can be explicitly enforced:nd = NGramDocument{String}(\"this is a ngram document\")\nngrams(nd)\ntd = TokenDocument{String}(\"this is a token document\")\ntokens(td)Conversion methods are available to switch between document types (the type parameter has to be specified as well).convert(TokenDocument{SubString}, StringDocument(\"some text\"))\nconvert(NGramDocument{String}, StringDocument(\"some more text\"))"
},

{
    "location": "examples/#Metadata-1",
    "page": "Usage examples",
    "title": "Metadata",
    "category": "section",
    "text": "Alongside the text data, documents also contain metadata.doc = StringDocument(\"this is another document\")\nmetadata(doc)\nfieldnames(typeof(metadata(doc)))Metadata fields can be modified through methods bearing the same name as the metadata field. Note that these methods are not explicitly exported.StringAnalysis.id!(doc, \"doc1\");\nStringAnalysis.author!(doc, \"Corneliu C.\");\nStringAnalysis.name!(doc, \"A simple document\");\nStringAnalysis.edition_year!(doc, \"2019\");\nStringAnalysis.published_year!(doc, \"2019\");\nmetadata(doc)"
},

{
    "location": "examples/#Corpus-1",
    "page": "Usage examples",
    "title": "Corpus",
    "category": "section",
    "text": "A corpus is an object that holds a bunch of documents together.docs = [sd, nd, td]\ncrps = Corpus(docs)\ncrps.documentsThe corpus can be \'standardized\' to hold the same type of document.standardize!(crps, NGramDocument{String})\ncrps.documentshowever, the corpus has to created from an AbstractDocument document vector for the standardization to work (AbstractDocument{T} vectors are converted to a Union of all documents types parametrized by T during Corpus construction):doc1 = StringDocument(\"one\");\ndoc2 = StringDocument(\"two\");\ndoc3 = TokenDocument(\"three\");\nstandardize!(Corpus([doc1, doc3]), NGramDocument{String})  # works\nstandardize!(Corpus([doc1, doc2]), NGramDocument{String})  # fails because we have a Vector{StringDocument{T}}\nstandardize!(Corpus(AbstractDocument[doc1, doc2]), NGramDocument{String})  # worksThe corpus can be also iterated through,for (i,doc) in enumerate(crps)\n    @show (i, doc)\nendindexed into,doc = crps[1]\ndocs = crps[2:3]and used as a container.push!(crps, NGramDocument{String}(\"new document\"))\ndoc4 = pop!(crps)\nngrams(doc4)"
},

{
    "location": "examples/#The-lexicon-and-inverse-index-1",
    "page": "Usage examples",
    "title": "The lexicon and inverse index",
    "category": "section",
    "text": "The Corpus object offers the ability of creating a lexicon and an inverse index for the documents present. These are not created when the Corpus is createdcrps.lexicon\ncrps.inverse_indexbut instead have to be explicitly created:update_lexicon!(crps)\ncrps.lexicon\nupdate_inverse_index!(crps)\ncrps.inverse_index"
},

{
    "location": "examples/#Preprocessing-1",
    "page": "Usage examples",
    "title": "Preprocessing",
    "category": "section",
    "text": "The text preprocessing mainly consists of the prepare and prepare! functions and preprocessing flags which start mostly with strip_ except for stem_words. The preprocessing function prepare works on AbstractDocument, Corpus and AbstractString types, returning new objects; prepare! works only on AbstractDocuments and Corpus as the strings are immutable.str=\"This is a text containing words, some more words, a bit of punctuation and 1 number...\";\nsd = StringDocument(str);\nflags = strip_punctuation|strip_articles|strip_punctuation|strip_whitespace\nprepare(str, flags)\nprepare!(sd, flags);\ntext(sd)More extensive preprocessing examples can be viewed in test/preprocessing.jl.One can strip parts of languages i.e. prepositions, articles in languages other than English (support provided from Languages.jl):using Languages\nit = StringDocument(\"Quest\'e un piccolo esempio di come si puo fare l\'analisi\");\nStringAnalysis.language!(it, Languages.Italian());\nprepare!(it, strip_articles|strip_prepositions|strip_whitespace);\nit.text"
},

{
    "location": "examples/#Features-1",
    "page": "Usage examples",
    "title": "Features",
    "category": "section",
    "text": ""
},

{
    "location": "examples/#Document-Term-Matrix-(DTM)-1",
    "page": "Usage examples",
    "title": "Document Term Matrix (DTM)",
    "category": "section",
    "text": "If a lexicon is present in the corpus, a document term matrix (DTM) can be created. The DTM acts as a basis for word-document statistics, allowing for the representation of documents as numerical vectors. The DTM is created by calling the object constructor using as argument the corpusM = DocumentTermMatrix(crps)\ntypeof(M)\nM = DocumentTermMatrix{Int8}(crps)\ntypeof(M)or the dtm functionM = dtm(crps, Int8);\nMatrix(M)It is important to note that the type parameter of the DTM object can be specified (also in the dtm function) but not specifically required. This can be useful in some cases for reducing memory requirements. The default element type of the DTM is specified by the constant DEFAULT_DTM_TYPE present in src/defaults.jl."
},

{
    "location": "examples/#Document-Term-Vectors-(DTVs)-1",
    "page": "Usage examples",
    "title": "Document Term Vectors (DTVs)",
    "category": "section",
    "text": "The individual rows of the DTM can also be generated iteratively whether a lexicon is present or not. If a lexicon is present, the each_dtv iterator allows the generation of the document vectors along with the control of the vector element type:for dv in each_dtv(crps, eltype=Int8)\n    @show dv\nendAlternatively, the vectors can be generated using the hash trick. This is a form of dimensionality reduction as cardinality i.e. output dimension is much smaller than the dimension of the original DTM vectors, which is equal to the length of the lexicon. The cardinality is a keyword argument of the Corpus constructor. The hashed vector output type can be specified when building the iterator:for dv in each_hash_dtv(Corpus(documents(crps), cardinality=5), eltype=Int8)\n    @show dv\nendOne can construct a \'hashed\' version of the DTM as well:hash_dtm(Corpus(documents(crps), cardinality=5), Int8)The default Corpus cardinality is specified by the constant DEFAULT_CARDINALITY present in src/defaults.jl."
},

{
    "location": "examples/#TF,-TF-IDF,-BM25-1",
    "page": "Usage examples",
    "title": "TF, TF-IDF, BM25",
    "category": "section",
    "text": "From the DTM, three more document-word statistics can be constructed: the term frequency, the tf-idf (term frequency - inverse document frequency) and Okapi BM25 using the tf, tf!, tf_idf, tf_idf!, bm_25 and bm_25! functions respectively. Their usage is very similar yet there exist several approaches one can take to constructing the output.The following examples with use the term frequency i.e. tf and tf!. When calling the functions that end without a !, which do not require the specification of an output matrix, one does not control the output\'s element type. The default output type is defined by the constant DEFAULT_FLOAT_TYPE = eltype(1.0):M = DocumentTermMatrix(crps);\ntfm = tf(M);\nMatrix(tfm)Control of the output matrix element type - which has to be a subtype of AbstractFloat - can be done only by using the in-place modification functions. One approach is to directly modify the DTM, provided that its elements are floating point numbers:M = DocumentTermMatrix{Float16}(crps)\nMatrix(M.dtm)\ntf!(M.dtm);  # inplace modification\nMatrix(M.dtm)\nM = DocumentTermMatrix(crps)  # Int elements\ntf!(M.dtm)  # fails because of Int elementsor, to provide a matrix output:rows, cols = size(M.dtm);\ntfm = zeros(Float16, rows, cols);\ntf!(M.dtm, tfm);\ntfmOne could also provide a sparse matrix output however it is important to note that in this case, the output matrix non-zero values have to correspond to the DTM\'s non-zero values:using SparseArrays\nrows, cols = size(M.dtm);\ntfm = spzeros(Float16, rows, cols)\ntfm[M.dtm .!= 0] .= 123;  # create explicitly non-zeros\ntf!(M.dtm, tfm);\nMatrix(tfm)"
},

{
    "location": "examples/#Dimensionality-reduction-1",
    "page": "Usage examples",
    "title": "Dimensionality reduction",
    "category": "section",
    "text": ""
},

{
    "location": "examples/#Random-projections-1",
    "page": "Usage examples",
    "title": "Random projections",
    "category": "section",
    "text": "In mathematics and statistics, random projection is a technique used to reduce the dimensionality of a set of points which lie in Euclidean space. Random projection methods are powerful methods known for their simplicity and less erroneous output compared with other methods. According to experimental results, random projection preserve distances well, but empirical results are sparse. They have been applied to many natural language tasks under the name of random indexing. The core idea behind random projection is given in the Johnson-Lindenstrauss lemma which states that if points in a vector space are of sufficiently high dimension, then they may be projected into a suitable lower-dimensional space in a way which approximately preserves the distances between the points (Wikipedia). The implementation here relies on the generalized sparse random projection matrix to generate a random projection model. For more details see the API documentation for RPModel and random_projection_matrix. To construct a random projection matrix that maps m dimension to k, one can dom = 10; k = 2; T = Float32;\ndensity = 0.2;  # percentage of non-zero elements\nR = StringAnalysis.random_projection_matrix(m, k, T, density)Building a random projection model from a DocumentTermMatrix or Corpus is straightforwardM = DocumentTermMatrix{Float32}(crps)\nmodel = RPModel(M, k=2, density=0.5, stats=:tf)\nmodel2 = rp(crps, T, k=17, density=0.1, stats=:tfidf)Once the model is created, one can reduce document term vector dimensionality. First, the document term vector is constructed using the stats keyword argument and subsequently, the vector is projected into the random sub-space:doc = StringDocument(\"this is a new document\")\nembed_document(model, doc)\nembed_document(model2, doc)Embedding a DTM or corpus can be done in a similar way:Matrix(embed_document(model, M))\nMatrix(embed_document(model2, crps))Random projection models can be saved/loaded to/from disk using a text format.file = \"model.txt\"\nmodel\nsave_rp_model(model, file)  # model saved\nprint(join(readlines(file)[1:5], \"\\n\"))  # first five lines\nnew_model = load_rp_model(file, Float64)  # change element type\nrm(file)"
},

{
    "location": "examples/#Semantic-Analysis-1",
    "page": "Usage examples",
    "title": "Semantic Analysis",
    "category": "section",
    "text": "The semantic analysis of a corpus relates to the task of building structures that approximate the concepts present in its documents. It does not necessarily involve prior semantic understanding of the documents (Wikipedia).StringAnalysis provides two approaches of performing semantic analysis of a corpus: latent semantic analysis (LSA) and latent Dirichlet allocation (LDA)."
},

{
    "location": "examples/#Latent-Semantic-Analysis-(LSA)-1",
    "page": "Usage examples",
    "title": "Latent Semantic Analysis (LSA)",
    "category": "section",
    "text": "The following example gives a straightforward usage example of LSA. It is geared towards information retrieval (LSI) as it focuses on document comparison and embedding. We assume a number of documents,doc1 = StringDocument(\"This is a text about an apple. There are many texts about apples.\");\ndoc2 = StringDocument(\"Pears and apples are good but not exotic. An apple a day keeps the doctor away.\");\ndoc3 = StringDocument(\"Fruits are good for you.\");\ndoc4 = StringDocument(\"This phrase has nothing to do with the others...\");\ndoc5 = StringDocument(\"Simple text, little info inside\");and create the corpus and its DTM:crps = Corpus(AbstractDocument[doc1, doc2, doc3, doc4, doc5]);\nprepare!(crps, strip_punctuation);\nupdate_lexicon!(crps);\nM = DocumentTermMatrix{Float32}(crps, sort(collect(keys(crps.lexicon))));Building an LSA model is straightforward:lm = LSAModel(M, k=3, stats=:tf)Once the model is created, it can be used to either embed documents,query = StringDocument(\"Apples and an exotic fruit.\");\nembed_document(lm, query)embed the corpus,U = embed_document(lm, crps)search for matching documents,idxs, corrs = cosine(lm, crps, query);\nfor (idx, corr) in zip(idxs, corrs)\n    println(\"$corr -> \\\"$(crps[idx].text)\\\"\");\nendor check for structure within the dataV = lm.Vᵀ\';\nMatrix(U*U\')  # document to document similarity\nMatrix(V*V\')  # term to term similarityLSA models can be saved/loaded to/from disk using a text format similar to the random projection model one.file = \"model.txt\"\nlm\nsave_lsa_model(lm, file)  # model saved\nprint(join(readlines(file)[1:5], \"\\n\"))  # first five lines\nnew_model = load_lsa_model(file, Float64)  # change element type\nrm(file)"
},

{
    "location": "examples/#Latent-Dirichlet-Allocation-(LDA)-1",
    "page": "Usage examples",
    "title": "Latent Dirichlet Allocation (LDA)",
    "category": "section",
    "text": "Documentation coming soon; check the API reference for information on the associated methods."
},

{
    "location": "api/#StringAnalysis.StringAnalysis",
    "page": "API Reference",
    "title": "StringAnalysis.StringAnalysis",
    "category": "module",
    "text": "A Julia library for working with text hard-forked from TextAnalysis.jl.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.DocumentTermMatrix",
    "page": "API Reference",
    "title": "StringAnalysis.DocumentTermMatrix",
    "category": "type",
    "text": "Basic Document-Term-Matrix (DTM) type.\n\nFields\n\ndtm::SparseMatriCSC{T,Int} the actual DTM; rows represent documents\n\nand columns represent terms\n\nterms::Vector{String} a list of terms that represent the lexicon of\n\nthe corpus associated with the DTM\n\ncolumn_indices::Dict{String, Int} a map between the terms and the\n\ncolumns of the dtm\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.DocumentTermMatrix-Union{Tuple{T}, Tuple{Corpus,Array{String,1}}} where T<:Real",
    "page": "API Reference",
    "title": "StringAnalysis.DocumentTermMatrix",
    "category": "method",
    "text": "DocumentTermMatrix{T}(crps::Corpus [,terms])\n\nAuxiliary constructor(s) of the DocumentTermMatrix type. The type T has to be a subtype of Real. The constructor(s) requires a corpus crps and a terms structure representing the lexicon of the corpus. The latter can be a Vector{String}, an AbstractDict where the keys are the lexicon or can be missing, in which case the lexicon field of the corpus is used.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.LSAModel",
    "page": "API Reference",
    "title": "StringAnalysis.LSAModel",
    "category": "type",
    "text": "LSAModel{S<:AbstractString, T<:AbstractFloat, A<:AbstractMatrix{T}, H<:Integer}\n\nLSA (latent semantic analysis) model. It constructs from a document term matrix (dtm) a model that can be used to embed documents in a latent semantic space pertaining to the data. The model requires that the document term matrix be a DocumentTermMatrix{T<:AbstractFloat} because the elements of the matrices resulted from the SVD operation are floating point numbers and these have to match or be convertible to type T.\n\nFields\n\nvocab::Vector{S} a vector with all the words in the corpus\nvocab_hash::Dict{S,H} a word to index in word embeddings matrix mapping\nΣinv::A inverse of the singular value matrix\nVᵀ::A transpose of the word embedding matrix\nstats::Symbol the statistical measure to use for word importances in documents\n\nAvailable values are: :tf (term frequency), :tfidf (default, term frequency - inverse document frequency) and :bm25 (Okapi BM25)\n\nidf::Vector{T} inverse document frequencies for the words in the vocabulary\nnwords::T averge number of words in a document\nκ::Int the κ parameter of the BM25 statistic\nβ::Float64 the β parameter of the BM25 statistic\ntol::T minimum size of the vector components (default T(1e-15))\n\nSVD matrices U, Σinv and Vᵀ:\n\nIf X is a m×n document-term-matrix with m documents and n words so that X[i,j] represents a statistical indicator of the importance of term j in document i then:\n\nU, Σ, V = svd(X)\nΣinv = inv(Σ)\nVᵀ = V\'\n\nThe matrix U is not actually stored in the model.\n\nExamples\n\njulia> using StringAnalysis\n\n       doc1 = StringDocument(\"This is a text about an apple. There are many texts about apples.\")\n       doc2 = StringDocument(\"Pears and apples are good but not exotic. An apple a day keeps the doctor away.\")\n       doc3 = StringDocument(\"Fruits are good for you.\")\n       doc4 = StringDocument(\"This phrase has nothing to do with the others...\")\n       doc5 = StringDocument(\"Simple text, little info inside\")\n\n       crps = Corpus(AbstractDocument[doc1, doc2, doc3, doc4, doc5])\n       prepare!(crps, strip_punctuation)\n       update_lexicon!(crps)\n       dtm = DocumentTermMatrix{Float32}(crps, sort(collect(keys(crps.lexicon))))\n\n       ### Build LSA Model ###\n       lsa_model = LSAModel(dtm, k=3, stats=:tf)\n\n       query = StringDocument(\"Apples and an exotic fruit.\")\n       idxs, corrs = cosine(lsa_model, crps, query)\n\n       println(\"Query: \"$(query.text)\"\")\n       for (idx, corr) in zip(idxs, corrs)\n           println(\"$corr -> \"$(crps[idx].text)\"\")\n       end\nQuery: \"Apples and an exotic fruit.\"\n0.9746108 -> \"Pears and apples are good but not exotic  An apple a day keeps the doctor away \"\n0.870703 -> \"This is a text about an apple  There are many texts about apples \"\n0.7122063 -> \"Fruits are good for you \"\n0.22725986 -> \"This phrase has nothing to do with the others \"\n0.076901935 -> \"Simple text  little info inside \"\n\nReferences:\n\nThe LSA wiki page\nDeerwester et al. 1990\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.RPModel",
    "page": "API Reference",
    "title": "StringAnalysis.RPModel",
    "category": "type",
    "text": "RPModel{S<:AbstractString, T<:AbstractFloat, A<:AbstractMatrix{T}, H<:Integer}\n\nRandom projection model. It constructs from a document term matrix (DTM) a model that can be used to embed documents in a random sub-space. The model requires that the document term matrix be a DocumentTermMatrix{T<:AbstractFloat} because the elements of the matrices resulted projection operation are floating point numbers and these have to match or be convertible to type T. The approach is based on the effects of the Johnson-Lindenstrauss lemma.\n\nFields\n\nvocab::Vector{S} a vector with all the words in the corpus\nvocab_hash::Dict{S,H} a word to index in the random projection maatrix mapping\nR::A the random projection matrix\nstats::Symbol the statistical measure to use for word importances in documents.\n\nAvailable values are: :tf (term frequency), :tfidf (default, term frequency -   inverse document frequency) and :bm25 (Okapi BM25)\n\nidf::Vector{T} inverse document frequencies for the words in the vocabulary\nnwords::T averge number of words in a document\nκ::Int the κ parameter of the BM25 statistic\nβ::Float64 the β parameter of the BM25 statistic\n\nReferences:\n\nKaski 1998\nAchlioptas 2001\nLi et al. 2006\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.TextHashFunction",
    "page": "API Reference",
    "title": "StringAnalysis.TextHashFunction",
    "category": "type",
    "text": "TextHashFunction(hash_function::Function, cardinality::Int)\n\nThe basic structure for performing text hashing: uses the hash_function to generate feature vectors of length cardinality.\n\nDetails\n\nThe hash trick is the use a hash function instead of a lexicon to determine the columns of a DocumentTermMatrix-like encoding of the data. To produce a DTM for a Corpus for which we do not have an existing lexicon, we need someway to map the terms from each document into column indices. We use the now standard \"Hash Trick\" in which we hash strings and then reduce the resulting integers modulo N, which defines the numbers of columns we want our DTM to have. This amounts to doing a non-linear dimensionality reduction with low probability that similar terms hash to the same dimension.\n\nTo make things easier, we wrap Julia\'s hash functions in a new type, TextHashFunction, which maintains information about the desired cardinality of the hashes.\n\nReferences:\n\nThe \"Hash Trick\" wiki page\nMoody, John 1989\n\nExamples\n\njulia> doc = StringDocument(\"this is a text\")\n       thf = TextHashFunction(hash, 13)\n       hash_dtv(doc, thf, Float16)\n13-element Array{Float16,1}:\n 1.0\n 1.0\n 0.0\n 0.0\n 0.0\n 0.0\n 0.0\n 2.0\n 0.0\n 0.0\n 0.0\n 0.0\n 0.0\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.cosine",
    "page": "API Reference",
    "title": "StringAnalysis.cosine",
    "category": "function",
    "text": "cosine(model, docs, doc, n=10)\n\nReturn the positions of the n closest neighboring documents to doc found in docs. docs can be a corpus or document term matrix. The vector representations of docs and doc are obtained with the model which can be either a LSAModel or RPModel.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.dtm-Tuple{DocumentTermMatrix}",
    "page": "API Reference",
    "title": "StringAnalysis.dtm",
    "category": "method",
    "text": "dtm(d::DocumentTermMatrix)\n\nAccess the matrix of a DocumentTermMatrix d.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.dtm-Union{Tuple{Corpus}, Tuple{T}, Tuple{Corpus,Type{T}}} where T<:Real",
    "page": "API Reference",
    "title": "StringAnalysis.dtm",
    "category": "method",
    "text": "dtm(crps::Corpus, eltype::Type{T}=DEFAULT_DTM_TYPE)\n\nAccess the matrix of the DTM associated with the corpus crps. The DocumentTermMatrix{T} will first have to be created in order for the actual matrix to be accessed.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.dtv-Union{Tuple{T}, Tuple{AbstractDocument,Dict{String,Int64}}, Tuple{AbstractDocument,Dict{String,Int64},Type{T}}} where T<:Real",
    "page": "API Reference",
    "title": "StringAnalysis.dtv",
    "category": "method",
    "text": "dtv(d::AbstractDocument, lex::Dict{String,Int}, eltype::Type{T}=DEFAULT_DTM_TYPE)\n\nCreates a document-term-vector with elements of type T for document d using the lexicon lex.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.dtv-Union{Tuple{T}, Tuple{Corpus,Int64}, Tuple{Corpus,Int64,Type{T}}} where T<:Real",
    "page": "API Reference",
    "title": "StringAnalysis.dtv",
    "category": "method",
    "text": "dtv(crps::Corpus, idx::Int, eltype::Type{T}=DEFAULT_DTM_TYPE)\n\nCreates a document-term-vector with elements of type T for document idx of the corpus crps.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.each_dtv-Union{Tuple{Corpus}, Tuple{U}} where U<:Real",
    "page": "API Reference",
    "title": "StringAnalysis.each_dtv",
    "category": "method",
    "text": "each_dtv(crps::Corpus [; eltype::Type{U}=DEFAULT_DTM_TYPE])\n\nIterates through the rows of the DTM of the corpus crps without constructing it. Useful when the DTM would not fit in memory. eltype specifies the element type of the generated vectors.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.each_hash_dtv-Union{Tuple{Corpus}, Tuple{U}} where U<:Real",
    "page": "API Reference",
    "title": "StringAnalysis.each_hash_dtv",
    "category": "method",
    "text": "each_hash_dtv(crps::Corpus [; eltype::Type{U}=DEFAULT_DTM_TYPE])\n\nIterates through the rows of the hashed DTM of the corpus crps without constructing it. Useful when the DTM would not fit in memory. eltype specifies the element type of the generated vectors.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.embed_document-Union{Tuple{H}, Tuple{A}, Tuple{T}, Tuple{S}, Tuple{LSAModel{S,T,A,H},AbstractDocument}} where H where A where T where S",
    "page": "API Reference",
    "title": "StringAnalysis.embed_document",
    "category": "method",
    "text": "embed_document(lm, doc)\n\nReturn the vector representation of doc, obtained using the LSA model lm. doc can be an AbstractDocument, Corpus or DTV or DTM.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.embed_document-Union{Tuple{H}, Tuple{A}, Tuple{T}, Tuple{S}, Tuple{RPModel{S,T,A,H},AbstractDocument}} where H where A where T where S",
    "page": "API Reference",
    "title": "StringAnalysis.embed_document",
    "category": "method",
    "text": "embed_document(rpm, doc)\n\nReturn the vector representation of doc, obtained using the random projection model rpm. doc can be an AbstractDocument, Corpus or DTV or DTM.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.frequent_terms",
    "page": "API Reference",
    "title": "StringAnalysis.frequent_terms",
    "category": "function",
    "text": "frequent_terms(doc, alpha)\n\nReturns a vector with frequent terms in the document doc. The parameter alpha indicates the sparsity threshold (a frequency <= alpha means sparse).\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.frequent_terms",
    "page": "API Reference",
    "title": "StringAnalysis.frequent_terms",
    "category": "function",
    "text": "frequent_terms(crps::Corpus, alpha)\n\nReturns a vector with frequent terms among all documents. The parameter alpha indicates the sparsity threshold (a frequency <= alpha means sparse).\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.get_vector-Union{Tuple{H}, Tuple{A}, Tuple{T}, Tuple{S}, Tuple{LSAModel{S,T,A,H},Any}} where H where A where T where S",
    "page": "API Reference",
    "title": "StringAnalysis.get_vector",
    "category": "method",
    "text": "get_vector(lm, word)\n\nReturns the vector representation of word from the LSA model lm.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.get_vector-Union{Tuple{H}, Tuple{A}, Tuple{T}, Tuple{S}, Tuple{RPModel{S,T,A,H},Any}} where H where A where T where S",
    "page": "API Reference",
    "title": "StringAnalysis.get_vector",
    "category": "method",
    "text": "get_vector(rpm, word)\n\nReturns the random projection vector corresponding to word in the random projection model rpm.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.hash_dtm-Union{Tuple{T}, Tuple{Corpus,TextHashFunction}, Tuple{Corpus,TextHashFunction,Type{T}}} where T<:Real",
    "page": "API Reference",
    "title": "StringAnalysis.hash_dtm",
    "category": "method",
    "text": "hash_dtm(crps::Corpus [,h::TextHashFunction], eltype::Type{T}=DEFAULT_DTM_TYPE)\n\nCreates a hashed DTM with elements of type T for corpus crps using the the hashing function h. If h is missing, the hash function of the Corpus is used.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.hash_dtv-Union{Tuple{T}, Tuple{AbstractDocument,TextHashFunction}, Tuple{AbstractDocument,TextHashFunction,Type{T}}} where T<:Real",
    "page": "API Reference",
    "title": "StringAnalysis.hash_dtv",
    "category": "method",
    "text": "hash_dtv(d::AbstractDocument, h::TextHashFunction, eltype::Type{T}=DEFAULT_DTM_TYPE)\n\nCreates a hashed document-term-vector with elements of type T for document d using the hashing function h.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.in_vocabulary-Tuple{LSAModel,AbstractString}",
    "page": "API Reference",
    "title": "StringAnalysis.in_vocabulary",
    "category": "method",
    "text": "in_vocabulary(lm, word)\n\nReturn true if word is part of the vocabulary of the LSA model lm and false otherwise.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.in_vocabulary-Tuple{RPModel,AbstractString}",
    "page": "API Reference",
    "title": "StringAnalysis.in_vocabulary",
    "category": "method",
    "text": "in_vocabulary(rpm, word)\n\nReturn true if word is part of the vocabulary of the random projection model rpm and false otherwise.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.index-Tuple{LSAModel,Any}",
    "page": "API Reference",
    "title": "StringAnalysis.index",
    "category": "method",
    "text": "index(lm, word)\n\nReturn the index of word from the LSA model lm.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.index-Tuple{RPModel,Any}",
    "page": "API Reference",
    "title": "StringAnalysis.index",
    "category": "method",
    "text": "index(rpm, word)\n\nReturn the index of word from the random projection model rpm.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.lda-Tuple{DocumentTermMatrix,Int64,Int64,Float64,Float64}",
    "page": "API Reference",
    "title": "StringAnalysis.lda",
    "category": "method",
    "text": "ϕ, θ = lda(dtm::DocumentTermMatrix, ntopics::Int, iterations::Int, α::Float64, β::Float64)\n\nPerform Latent Dirichlet allocation.\n\nArguments\n\nα Dirichlet dist. hyperparameter for topic distribution per document. α<1 yields a sparse topic mixture for each document. α>1 yields a more uniform topic mixture for each document.\nβ Dirichlet dist. hyperparameter for word distribution per topic. β<1 yields a sparse word mixture for each topic. β>1 yields a more uniform word mixture for each topic.\n\nReturn values\n\nϕ: ntopics × nwords Sparse matrix of probabilities s.t. sum(ϕ, 1) == 1\nθ: ntopics × ndocs Dense matrix of probabilities s.t. sum(θ, 1) == 1\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.load_lsa_model-Union{Tuple{AbstractString}, Tuple{T}, Tuple{AbstractString,Type{T}}} where T<:AbstractFloat",
    "page": "API Reference",
    "title": "StringAnalysis.load_lsa_model",
    "category": "method",
    "text": "load_lsa_model(filename, eltype; [sparse=true])\n\nLoads an LSA model from filename into an LSA model object. The embeddings matrix element type is specified by eltype (default DEFAULT_FLOAT_TYPE) while the keyword argument sparse specifies whether the matrix should be sparse or not.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.load_rp_model-Union{Tuple{AbstractString}, Tuple{T}, Tuple{AbstractString,Type{T}}} where T<:AbstractFloat",
    "page": "API Reference",
    "title": "StringAnalysis.load_rp_model",
    "category": "method",
    "text": "load_rp_model(filename, eltype; [sparse=true])\n\nLoads an random projection model from filename into an random projection model object. The projection matrix element type is specified by eltype (default DEFAULT_FLOAT_TYPE) while the keyword argument sparse specifies whether the matrix should be sparse or not.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.lsa-Union{Tuple{DocumentTermMatrix{T}}, Tuple{T}} where T<:AbstractFloat",
    "page": "API Reference",
    "title": "StringAnalysis.lsa",
    "category": "method",
    "text": "lsa(X [;k=<num documents>, stats=:tfidf, κ=2, β=0.75, tol=1e-15])\n\nConstructs a LSA model. The input X can be a Corpus or a DocumentTermMatrix. Use ?LSAModel for more details. Vector components smaller than tol will be zeroed out.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.rp-Union{Tuple{DocumentTermMatrix{T}}, Tuple{T}} where T<:AbstractFloat",
    "page": "API Reference",
    "title": "StringAnalysis.rp",
    "category": "method",
    "text": "rp(X [;k=m, density=1/sqrt(k), stats=:tfidf, κ=2, β=0.75])\n\nConstructs a random projection model. The input X can be a Corpus or a DocumentTermMatrix with m words in the lexicon. The model does not store the corpus or DTM document embeddings, just the projection matrix. Use ?RPModel for more details.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.save_lsa_model-Union{Tuple{H}, Tuple{A}, Tuple{T}, Tuple{S}, Tuple{LSAModel{S,T,A,H},AbstractString}} where H where A where T where S",
    "page": "API Reference",
    "title": "StringAnalysis.save_lsa_model",
    "category": "method",
    "text": "save(lm, filename)\n\nSaves an LSA model lm to disc in file filename.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.save_rp_model-Union{Tuple{H}, Tuple{A}, Tuple{T}, Tuple{S}, Tuple{RPModel{S,T,A,H},AbstractString}} where H where A where T where S",
    "page": "API Reference",
    "title": "StringAnalysis.save_rp_model",
    "category": "method",
    "text": "save_rp_model(rpm, filename)\n\nSaves an random projection model rpm to disc in file filename.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.sentence_tokenize-Union{Tuple{T}, Tuple{T}} where T<:AbstractString",
    "page": "API Reference",
    "title": "StringAnalysis.sentence_tokenize",
    "category": "method",
    "text": "sentence_tokenize([lang,] s)\n\nSplits string s into sentences using WordTokenizers.split_sentences function to perform the tokenization. If a language lang is provided, it ignores it ;)\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.similarity-Tuple{Any,Any,Any}",
    "page": "API Reference",
    "title": "StringAnalysis.similarity",
    "category": "method",
    "text": "similarity(model, doc1, doc2)\n\nReturn the cosine similarity value between two documents doc1 and doc2 whose vector representations have been obtained using the model, which can be either a LSAModel or RPModel.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.sparse_terms",
    "page": "API Reference",
    "title": "StringAnalysis.sparse_terms",
    "category": "function",
    "text": "sparse_terms(doc, alpha)\n\nReturns a vector with rare terms in the document doc. The parameter alpha indicates the sparsity threshold (a frequency <= alpha means sparse).\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.sparse_terms",
    "page": "API Reference",
    "title": "StringAnalysis.sparse_terms",
    "category": "function",
    "text": "sparse_terms(crps::Corpus, alpha)\n\nReturns a vector with rare terms among all documents. The parameter alpha indicates the sparsity threshold (a frequency <= alpha means sparse).\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.tokenize-Tuple{Any}",
    "page": "API Reference",
    "title": "StringAnalysis.tokenize",
    "category": "method",
    "text": "tokenize(s [;method])\n\nTokenizes based on either the tokenize_slow or tokenize_fast functions.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.tokenize_fast-Union{Tuple{Array{S,1}}, Tuple{S}} where S<:AbstractString",
    "page": "API Reference",
    "title": "StringAnalysis.tokenize_fast",
    "category": "method",
    "text": "tokenize_fast(doc [;splitter])\n\nFunction that quickly tokenizes doc based on the splitting pattern specified by splitter::RegEx. Supported types for doc are: AbstractString, Vector{AbstractString}, StringDocument and NGramDocument.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.tokenize_slow-Union{Tuple{T}, Tuple{T}} where T<:AbstractString",
    "page": "API Reference",
    "title": "StringAnalysis.tokenize_slow",
    "category": "method",
    "text": "tokenize_slow([lang,] s)\n\nSplits string s into tokens on whitespace using WordTokenizers.tokenize function to perform the tokenization. If a language lang is provided, it ignores it ;)\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.vocabulary-Tuple{LSAModel}",
    "page": "API Reference",
    "title": "StringAnalysis.vocabulary",
    "category": "method",
    "text": "vocabulary(lm)\n\nReturn the vocabulary as a vector of words of the LSA model lm.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.vocabulary-Tuple{RPModel}",
    "page": "API Reference",
    "title": "StringAnalysis.vocabulary",
    "category": "method",
    "text": "vocabulary(rpm)\n\nReturn the vocabulary as a vector of words of the random projection model rpm.\n\n\n\n\n\n"
},

{
    "location": "api/#Base.size-Tuple{LSAModel}",
    "page": "API Reference",
    "title": "Base.size",
    "category": "method",
    "text": "size(lm)\n\nReturn a tuple containin input and output dimensionalities of the LSA model lm.\n\n\n\n\n\n"
},

{
    "location": "api/#Base.size-Tuple{RPModel}",
    "page": "API Reference",
    "title": "Base.size",
    "category": "method",
    "text": "size(rpm)\n\nReturn a tuple containing the input data and projection sub-space dimensionalities of the random projection model rpm.\n\n\n\n\n\n"
},

{
    "location": "api/#Base.summary-Tuple{AbstractDocument}",
    "page": "API Reference",
    "title": "Base.summary",
    "category": "method",
    "text": "summary(doc)\n\nShows information about the document doc.\n\n\n\n\n\n"
},

{
    "location": "api/#Base.summary-Tuple{Corpus}",
    "page": "API Reference",
    "title": "Base.summary",
    "category": "method",
    "text": "summary(crps)\n\nShows information about the corpus crps.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.embed_word-Tuple{LSAModel,Any}",
    "page": "API Reference",
    "title": "StringAnalysis.embed_word",
    "category": "method",
    "text": "embed_word(lm, word)\n\nReturn the vector representation of word using the LSA model lm.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.random_projection_matrix-Union{Tuple{T}, Tuple{Int64,Int64,Type{T},Float64}} where T<:AbstractFloat",
    "page": "API Reference",
    "title": "StringAnalysis.random_projection_matrix",
    "category": "method",
    "text": "random_projection_matrix(m::Int, k::Int, eltype::Type{T<:AbstractFloat}, density::Float64)\n\nBuilds a m×k sparse random projection matrix with elements of type T and a non-zero element frequency of density. m and k are the input and output dimensionalities.\n\nIf we note s = 1 / density, the components of the random matrix are drawn from:\n\n-sqrt(s) / sqrt(k) with probability 1/2s\n0 with probability 1 - 1/s\n+sqrt(s) / sqrt(k)   with probability 1/2s\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.remove_patterns!-Tuple{FileDocument,Regex}",
    "page": "API Reference",
    "title": "StringAnalysis.remove_patterns!",
    "category": "method",
    "text": "remove_patterns!(d, rex)\n\nRemoves from the document or corpus d the text matching the pattern described by the regular expression rex.\n\n\n\n\n\n"
},

{
    "location": "api/#StringAnalysis.remove_patterns-Tuple{AbstractString,Regex}",
    "page": "API Reference",
    "title": "StringAnalysis.remove_patterns",
    "category": "method",
    "text": "remove_patterns(s, rex)\n\nRemoves from the string s the text matching the pattern described by the regular expression rex.\n\n\n\n\n\n"
},

{
    "location": "api/#",
    "page": "API Reference",
    "title": "API Reference",
    "category": "page",
    "text": "Modules = [StringAnalysis]"
},

]}
