# TF: Term frequency

# The score was modified according to:
#   https://opensourceconnections.com/blog/2015/10/16/bm25-the-next-generation-of-lucene-relevation/
function tf!(dtm::AbstractMatrix{T}, tf::AbstractMatrix{F}
            ) where {T<:Real, F<:AbstractFloat}
    @assert size(dtm) == size(tf)
    n, p = size(dtm)
    # TF tells us what proportion of a document is defined by a term
    words_in_documents = sum(dtm, dims=2)
    @inbounds for i in 1:n
        tf[i, :] = sqrt.(dtm[i, :] ./ max(words_in_documents[i], one(T)))
    end
    return tf
end

# assumes second matrix has same nonzeros as first one
function tf!(dtm::SparseMatrixCSC{T}, tf::SparseMatrixCSC{F}
            ) where {T<:Real, F<:AbstractFloat}
    @assert size(dtm) == size(tf)
    rows = rowvals(dtm)
    dtmvals = nonzeros(dtm)
    tfvals = nonzeros(tf)
    @assert size(dtmvals) == size(tfvals)
    # TF tells us what proportion of a document is defined by a term
    words_in_documents = sum(dtm,dims=2)
    n, p = size(dtm)
    for i = 1:p
       for j in nzrange(dtm, i)
          row = rows[j]
          tfvals[j] = sqrt.(dtmvals[j] / max(words_in_documents[row], one(T)))
       end
    end
    return tf
end

tf!(dtm::AbstractMatrix{T}) where T<:Real = tf!(dtm, dtm)

tf(dtm::AbstractMatrix{T}) where T<:Integer = tf!(dtm, similar(dtm, DEFAULT_FLOAT_TYPE))

tf(dtm::AbstractMatrix{T}) where T<:AbstractFloat = tf!(dtm, similar(dtm, T))

tf(dtm::DocumentTermMatrix) = tf(dtm.dtm)

tf!(dtm::DocumentTermMatrix) = tf!(dtm.dtm)


# TF-IDF: Term frequency - Inverse document frequency
# The score was modified according to:
#   https://opensourceconnections.com/blog/2015/10/16/bm25-the-next-generation-of-lucene-relevation/
function tf_idf!(dtm::AbstractMatrix{T}, tfidf::AbstractMatrix{F}
                ) where {T<:Real, F<:AbstractFloat}
    @assert size(dtm) == size(tfidf)
    n, p = size(dtm)
    # TF tells us what proportion of a document is defined by a term
    tf!(dtm, tfidf)
    # IDF tells us how rare a term is in the corpus
    documents_containing_term = vec(sum(dtm .> 0, dims=1)) .+ one(T)
    idf = log.(n ./ documents_containing_term) .+ one(F)
    # TF-IDF is the product of TF and IDF
    @inbounds @simd for j in 1:p
        for i in 1:n
           tfidf[i, j] = tfidf[i, j] * idf[j]
        end
    end
    return tfidf
end

function tf_idf!(dtm::SparseMatrixCSC{T}, tfidf::SparseMatrixCSC{F}
                ) where {T<:Real, F<:AbstractFloat}
    @assert size(dtm) == size(tfidf)
    rows = rowvals(dtm)
    dtmvals = nonzeros(dtm)
    tfidfvals = nonzeros(tfidf)
    @assert size(dtmvals) == size(tfidfvals)
    n, p = size(dtm)
    # TF tells us what proportion of a document is defined by a term
    words_in_documents = F.(sum(dtm, dims=2))
    oneval = one(F)
    # IDF tells us how rare a term is in the corpus
    documents_containing_term = vec(sum(dtm .> 0, dims=1)) .+ one(T)
    idf = log.(n ./ documents_containing_term) .+ oneval
    for i = 1:p
       for j in nzrange(dtm, i)
          row = rows[j]
          tfidfvals[j] = sqrt.(dtmvals[j] / max(words_in_documents[row], oneval)) * idf[i]
       end
    end
    return tfidf
end

tf_idf!(dtm::AbstractMatrix{T}) where T<:Real = tf_idf!(dtm, dtm)

tf_idf(dtm::AbstractMatrix{T}) where T<:Integer = tf_idf!(dtm, similar(dtm, DEFAULT_FLOAT_TYPE))

tf_idf(dtm::AbstractMatrix{T}) where T<:AbstractFloat = tf_idf!(dtm, similar(dtm, T))

tf_idf(dtm::DocumentTermMatrix) = tf_idf(dtm.dtm)

tf_idf!(dtm::DocumentTermMatrix) = tf_idf!(dtm.dtm)


# BM25: Okapi Best Match 25
# Details at: https://en.wikipedia.org/wiki/Okapi_BM25
function bm_25!(dtm::AbstractMatrix{T},
                bm25::AbstractMatrix{F};
                κ::Int=BM25_KAPPA,
                β::Float64=BM25_BETA
               ) where {T<:Real, F<:AbstractFloat}
    @assert size(dtm) == size(bm25)
    # Initializations
    k = F(κ)
    b = F(β)
    n, p = size(dtm)
    oneval = one(F)
    # TF tells us what proportion of a document is defined by a term
    tf!(dtm, bm25)
    words_in_documents = F.(sum(dtm, dims=2))
    ln = words_in_documents./mean(words_in_documents)
    # IDF tells us how rare a term is in the corpus
    documents_containing_term = vec(sum(dtm .> 0, dims=1)) .+ one(T)
    idf = log.(n ./ documents_containing_term) .+ oneval
    # BM25 is the product of IDF and a fudged TF
    @inbounds @simd for j in 1:p
        for i in 1:n
            bm25[i, j] = idf[j] *
                ((k + 1) * bm25[i, j]) /
                (k * (oneval - b + b * ln[i]) + bm25[i, j])
        end
    end
    return bm25
end

function bm_25!(dtm::SparseMatrixCSC{T},
                bm25::SparseMatrixCSC{F};
                κ::Int=BM25_KAPPA,
                β::Float64=BM25_BETA
               ) where {T<:Real, F<:AbstractFloat}
    @assert size(dtm) == size(bm25)
    # Initializations
    k = F(κ)
    b = F(β)
    rows = rowvals(dtm)
    dtmvals = nonzeros(dtm)
    bm25vals = nonzeros(bm25)
    @assert size(dtmvals) == size(bm25vals)
    n, p = size(dtm)
    # TF tells us what proportion of a document is defined by a term
    words_in_documents = F.(sum(dtm, dims=2))
    ln = words_in_documents./mean(words_in_documents)
    oneval = one(F)
    # IDF tells us how rare a term is in the corpus
    documents_containing_term = vec(sum(dtm .> 0, dims=1)) .+ one(T)
    idf = log.(n ./ documents_containing_term) .+ oneval
    for i = 1:p
       for j in nzrange(dtm, i)
          row = rows[j]
          tf = sqrt.(dtmvals[j] / max(words_in_documents[row], oneval))
          bm25vals[j] = idf[i] * ((k + 1) * tf) /
                        (k * (oneval - b + b * ln[row]) + tf)
       end
    end
    return bm25
end

bm_25!(dtm::AbstractMatrix{T}; κ::Int=BM25_KAPPA, β::Float64=BM25_BETA) where T<:Real =
    bm_25!(dtm, dtm, κ=κ, β=β)

bm_25(dtm::AbstractMatrix{T}; κ::Int=BM25_KAPPA, β::Float64=BM25_BETA) where T<:Integer =
    bm_25!(dtm, similar(dtm, DEFAULT_FLOAT_TYPE), κ=κ, β=β)

bm_25(dtm::AbstractMatrix{T}; κ::Int=BM25_KAPPA, β::Float64=BM25_BETA) where T<:AbstractFloat =
    bm_25!(dtm, similar(dtm, T), κ=κ, β=β)

bm_25(dtm::DocumentTermMatrix; κ::Int=BM25_KAPPA, β::Float64=BM25_BETA) =
    bm_25(dtm.dtm, κ=κ, β=β)

bm_25!(dtm::DocumentTermMatrix; κ::Int=BM25_KAPPA, β::Float64=BM25_BETA) =
    bm_25!(dtm.dtm, κ=κ, β=β)