"""
    LSAModel{S<:AbstractString, T<:AbstractFloat, A<:AbstractMatrix{T}, H<:Integer}

LSA (latent semantic analysis) model. It constructs from a document term matrix (dtm)
a model that can be used to embed documents in a latent semantic space pertaining to
the data. The model requires that the document term matrix be a
`DocumentTermMatrix{T<:AbstractFloat}` because the elements of the matrices resulted
from the SVD operation are floating point numbers and these have to match or be
convertible to type `T`.

# Fields
  * `vocab::Vector{S}` a vector with all the words in the corpus
  * `vocab_hash::Dict{S,H}` a word to index in word embeddings matrix mapping
  * `Σinv::A` inverse of the singular value matrix
  * `Vᵀ::A` transpose of the word embedding matrix
  * `stats::Symbol` the statistical measure to use for word importances in documents
Available values are: `:tf` (term frequency), `:tfidf` (default, term frequency -
inverse document frequency) and `:bm25` (Okapi BM25)
  * `idf::Vector{T}` inverse document frequencies for the words in the vocabulary
  * `nwords::T` averge number of words in a document
  * `κ::Int` the `κ` parameter of the BM25 statistic
  * `β::Float64` the `β` parameter of the BM25 statistic
  * `tol::T` minimum size of the vector components (default `T(1e-15)`)

# SVD matrices `U`, `Σinv` and `Vᵀ`:
  If `X` is a `m`×`n` document-term-matrix with `m` documents and `n` words so that
`X[i,j]` represents a statistical indicator of the importance of term `j` in document `i`
then:
  * `U, Σ, V = svd(X)`
  * `Σinv = inv(Σ)`
  * `Vᵀ = V'`
  The matrix `U` is not actually stored in the model.

# Examples
```
julia> using StringAnalysis

       doc1 = StringDocument("This is a text about an apple. There are many texts about apples.")
       doc2 = StringDocument("Pears and apples are good but not exotic. An apple a day keeps the doctor away.")
       doc3 = StringDocument("Fruits are good for you.")
       doc4 = StringDocument("This phrase has nothing to do with the others...")
       doc5 = StringDocument("Simple text, little info inside")

       crps = Corpus(AbstractDocument[doc1, doc2, doc3, doc4, doc5])
       prepare!(crps, strip_punctuation)
       update_lexicon!(crps)
       dtm = DocumentTermMatrix{Float32}(crps, sort(collect(keys(crps.lexicon))))

       ### Build LSA Model ###
       lsa_model = LSAModel(dtm, k=3, stats=:tf)

       query = StringDocument("Apples and an exotic fruit.")
       idxs, corrs = cosine(lsa_model, crps, query)

       println("Query: \"\$(query.text)\"")
       for (idx, corr) in zip(idxs, corrs)
           println("\$corr -> \"\$(crps[idx].text)\"")
       end
Query: "Apples and an exotic fruit."
0.9746108 -> "Pears and apples are good but not exotic  An apple a day keeps the doctor away "
0.870703 -> "This is a text about an apple  There are many texts about apples "
0.7122063 -> "Fruits are good for you "
0.22725986 -> "This phrase has nothing to do with the others "
0.076901935 -> "Simple text  little info inside "
```

# References:
  * [The LSA wiki page](https://en.wikipedia.org/wiki/Latent_semantic_analysis)
  * [Deerwester et al. 1990](http://lsa.colorado.edu/papers/JASIS.lsi.90.pdf)

"""
struct LSAModel{S<:AbstractString, T<:AbstractFloat, A<:AbstractMatrix{T}, H<:Integer}
    vocab::Vector{S}        # vocabulary
    vocab_hash::Dict{S,H}   # term to column index in V
    Σinv::A                 # inverse of Σ
    Vᵀ::A                   # word vectors (transpose of V)
    stats::Symbol           # term/document importance
    idf::Vector{T}          # inverse document frequencies
    nwords::T               # average words/document in corpus
    κ::Int                  # κ parameter for Okapi BM25 (used if stats==:bm25)
    β::Float64              # β parameter for Okapi BM25 (used if stats==:bm25)
    tol::T                  # Minimum size of vector elements
end

function LSAModel(dtm::DocumentTermMatrix{T}; kwargs...) where T<:Integer
    throw(ErrorException(
        """A LSA model requires a that the document term matrix
        be a DocumentTermMatrix{<:AbstractFloat}!"""))
end

function LSAModel(dtm::DocumentTermMatrix{T};
                  k::Int=size(dtm.dtm, 1),
                  stats::Symbol=:tfidf,
                  tol::T=T(1e-15),
                  κ::Int=2,
                  β::Float64=0.75
                 ) where T<:AbstractFloat
    n, p = size(dtm.dtm)
    zeroval = zero(T)
    minval = T(tol)
    # Checks
    length(dtm.terms) == p ||
        throw(DimensionMismatch("Dimensions inside dtm are inconsistent."))
    k > n &&
        @warn "k can be at most $n; using k=$n"
    if !(stats in [:count, :tf, :tfidf, :bm25])
        @warn "stats has to be either :tf, :tfidf or :bm25; defaulting to :tfidf"
        stats = :tfidf
    end
    # Calculate inverse document frequency, mean document size
    documents_containing_term = vec(sum(dtm.dtm .> 0, dims=1)) .+ one(T)
    idf = log.(n ./ documents_containing_term) .+ one(T)
    nwords = mean(sum(dtm.dtm, dims=2))
    # Get X
    if stats == :count
        X = dtm.dtm
    elseif stats == :tf
        X = tf(dtm.dtm)
    elseif stats == :tfidf
        X = tf_idf(dtm.dtm)
    elseif stats == :bm25
        X = bm_25(dtm.dtm, κ=κ, β=β)
    end
    # Decompose document-word statistic
    _, Σ, V = tsvd(X, k)
    # Build model components
    Σinv = diagm(0 => 1 ./ Σ)
    Σinv[abs.(Σinv) .< minval] .= zeroval
    V = V'
    V[abs.(V).< minval] .= zeroval
    # Note: explicit type annotation ensures type stability
    Σinv::SparseMatrixCSC{T,Int} = SparseMatrixCSC{T, Int}(Σinv)
    V = SparseMatrixCSC{T, Int}(V)
    # Return the model
    return LSAModel(dtm.terms, dtm.column_indices,
                    Σinv, V,
                    stats, idf, nwords, κ, β, minval)
end


function Base.show(io::IO, lm::LSAModel{S,T,A,H}) where {S,T,A,H}
    len_vecs, num_terms = size(lm.Vᵀ)
    print(io, "LSA Model ($(lm.stats)), $(num_terms) terms, " *
          "dimensionality $(len_vecs), $(T) vectors")
end


"""
    lsa(X [;k=<num documents>, stats=:tfidf, κ=2, β=0.75, tol=1e-15])

Constructs a LSA model. The input `X` can be a `Corpus` or a `DocumentTermMatrix`.
Use `?LSAModel` for more details. Vector components smaller than `tol` will be
zeroed out.
"""
function lsa(dtm::DocumentTermMatrix{T};
             k::Int=size(dtm.dtm, 1),
             stats::Symbol=:tfidf,
             tol::T=T(1e-15),
             κ::Int=2,
             β::Float64=0.75) where T<:AbstractFloat
    LSAModel(dtm, k=k, stats=stats, κ=κ, β=β, tol=tol)
end

function lsa(crps::Corpus,
             ::Type{T} = DEFAULT_FLOAT_TYPE;
             k::Int=length(crps),
             stats::Symbol=:tfidf,
             tol::T=T(1e-15),
             κ::Int=2,
             β::Float64=0.75) where T<:AbstractFloat
    if isempty(crps.lexicon)
        update_lexicon!(crps)
    end
    lsa(DocumentTermMatrix{T}(crps, lexicon(crps)), k=k, stats=stats, κ=κ, β=β, tol=tol)
end


"""
    vocabulary(lm)

Return the vocabulary as a vector of words of the LSA model `lm`.
"""
vocabulary(lm::LSAModel) = lm.vocab


"""
    in_vocabulary(lm, word)

Return `true` if `word` is part of the vocabulary of the LSA model `lm` and
`false` otherwise.
"""
in_vocabulary(lm::LSAModel, word::AbstractString) = word in lm.vocab


"""
    size(lm)

Return a tuple containin input and output dimensionalities of the LSA model `lm`.
"""
size(lm::LSAModel) = size(lm.Vᵀ,2), size(lm.Σinv,1)


"""
    index(lm, word)

Return the index of `word` from the LSA model `lm`.
"""
index(lm::LSAModel, word) = lm.vocab_hash[word]


"""
    get_vector(lm, word)

Returns the vector representation of `word` from the LSA model `lm`.
"""
function get_vector(lm::LSAModel{S,T,A,H}, word) where {S,T,A,H}
    default = zeros(T, size(lm.Σinv,1))
    idx = get(lm.vocab_hash, word, 0)
    if idx == 0
        return default
    else
        return lm.Vᵀ[:, idx]
    end
end


"""
    embed_document(lm, doc)

Return the vector representation of a document `doc`, obtained using the LSA model `lm`.
"""
embed_document(lm::LSAModel{S,T,A,H}, doc::AbstractDocument) where {S,T,A,H} =
    # Hijack vocabulary hash to use as lexicon (only the keys needed)
    embed_document(lm, dtv(doc, lm.vocab_hash, T))

embed_document(lm::LSAModel{S,T,A,H}, doc::AbstractString) where {S,T,A,H} =
    embed_document(lm, NGramDocument{S}(doc))

embed_document(lm::LSAModel{S,T,A,H}, doc::Vector{S2}) where {S,T,A,H,S2<:AbstractString} =
    embed_document(lm, TokenDocument{S}(doc))

# Actual embedding function: takes as input the LSA model `lm` and a document
# term vector `dtv`. Returns the representation of `dtv` in the embedding space.
function embed_document(lm::LSAModel{S,T,A,H}, dtv::AbstractVector{T}) where {S,T,A,H}
    words_in_document = sum(dtv)
    # Calculate document vector
    tf = sqrt.(dtv ./ max(words_in_document, one(T)))
    if lm.stats == :tf
        v = tf
    elseif lm.stats == :tfidf
        v = tf .* lm.idf
    elseif lm.stats == :bm25
        k = T(lm.κ)
        b = T(lm.β)
        v = lm.idf .* ((k + 1) .* tf) ./
                       (k * (one(T) - b + b * words_in_document/lm.nwords) .+ tf)
    end
    # Embed
    d̂ = lm.Σinv * lm.Vᵀ * v         # embed
    d̂ = d̂ ./ (norm(d̂,2) .+ eps(T))  # normalize
    d̂[abs.(d̂) .< lm.tol] .= zero(T) # zero small elements
    return d̂
end


"""
    embed_word(lm, word)

Return the vector representation of `word` using the LSA model `lm`.
"""
function embed_word(lm::LSAModel, word)
    throw(ErrorException(
        """Word embedding is not supported as it would require storing
        all documents in the model in order to determine the counts
        of `word` across the corpus."""))
end


"""
    cosine(lm, docs, doc, n=10)

Return the positions of the `n` closest neighboring documents to `doc`
found in `docs`. `docs` can be a corpus or document term matrix.
"""
function cosine(lm::LSAModel{S,T,A,H}, docs::DocumentTermMatrix{T}, doc, n=10
               ) where {S,T,A,H}
    n = size(docs.dtm,1)
    k = size(lm.Vᵀ, 1)
    U = similar(lm.Vᵀ, n, k)
    @inbounds for i in 1:n
        U[i,:] = embed_document(lm, docs[i,:])
    end
    U[abs.(U) .< lm.tol] .= zero(T)
    metrics = U * embed_document(lm, doc)
    n = min(n, length(metrics))
    topn_positions = sortperm(metrics[:], rev = true)[1:n]
    topn_metrics = metrics[topn_positions]
    return topn_positions, topn_metrics
end

function cosine(lm::LSAModel{S,T,A,H}, crps::Corpus, doc, n=10) where {S,T,A,H}
    if isempty(crps.lexicon)
        update_lexicon!(crps)
    end
    cosine(lm, DocumentTermMatrix{T}(crps, lexicon(crps)), doc, n)
end


"""
    similarity(lm, doc1, doc2)

Return the cosine similarity value between two documents `doc1` and `doc2`
whose vector representations have been obtained using the LSA model `lm`.
"""
function similarity(lm::LSAModel, doc1, doc2)
    return embed_document(lm, doc1)' * embed_document(lm, doc2)
end


"""
    save(lm, filename)

Saves an LSA model `lm` to disc in file `filename`.
"""
function save_lsa_model(lm::LSAModel{S,T,A,H}, filename::AbstractString) where {S,T,A,H}
    k, nwords = size(lm.Vᵀ)
    open(filename, "w") do fid
        println(fid, "LSA Model saved at $(Dates.now())")
        println(fid, "$nwords $k")  # number of documents, words, k
        println(fid, lm.stats)
        writedlm(fid, lm.idf', " ")
        println(fid, lm.nwords)
        println(fid, lm.κ)
        println(fid, lm.β)
        println(fid, lm.tol)
        # Σinv diagonal
        writedlm(fid, diag(lm.Σinv)', " ")
        # Word embeddings
        idxs = [lm.vocab_hash[word] for word in lm.vocab]
        writedlm(fid, [lm.vocab lm.Vᵀ[:, idxs]'], " ")
    end
end


"""
    load_lsa_model(filename, eltype; [sparse=true])

Loads an LSA model from `filename` into an LSA model object. The embeddings matrix
element type is specified by `eltype` (default `DEFAULT_FLOAT_TYPE`) while the keyword argument
`sparse` specifies whether the matrix should be sparse or not.
"""
function load_lsa_model(filename::AbstractString, ::Type{T}=DEFAULT_FLOAT_TYPE;
                        sparse::Bool=true) where T<: AbstractFloat
    # Matrix type for LSA model
    A = ifelse(sparse, SparseMatrixCSC{T, Int}, Matrix{T})
    # Define parsed variables local to outer scope of do statement
    local vocab, vocab_hash, Σinv, Vᵀ, stats, idf, nwords, κ, β, tol
    open(filename, "r") do fid
        readline(fid)  # first line, header
        line = readline(fid)
        vocab_size, k = map(x -> parse(Int, x), split(line, ' '))
        # Preallocate
        vocab = Vector{String}(undef, vocab_size)
        vocab_hash = Dict{String, Int}()
        if sparse
            Vᵀ = SparseMatrixCSC{T, Int}(UniformScaling(0), k, vocab_size)
            Σinv = spzeros(T, k, k)
        else
            Vᵀ = Matrix{T}(undef, k, vocab_size)
            Σinv = zeros(T, k, k)
        end
        # Start parsing the rest of the file
        stats = Symbol(strip(readline(fid)))
        idf = map(x->parse(T, x), split(readline(fid), ' '))
        nwords = parse(T, readline(fid))
        κ = parse(Int, readline(fid))
        β = parse(Float64, readline(fid))
        tol = parse(Float64, readline(fid))
        Σinv[diagind(Σinv)] .= map(x->parse(T, x), split(readline(fid), ' '))
        for i in 1:vocab_size
            line = strip(readline(fid))
            parts = split(line, ' ')
            word = parts[1]
            vector = map(x-> parse(T, x), parts[2:end])
            vocab[i] = word
            push!(vocab_hash, word=>i)
            Vᵀ[:, i] = vector
        end
    end
    return LSAModel{String, T, A, Int}(vocab, vocab_hash, Σinv, Vᵀ,
                                       stats, idf, nwords, κ, β, tol)
end
