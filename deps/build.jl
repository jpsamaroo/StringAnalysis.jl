using BinaryProvider
# This is where all binaries will get installed
const prefix = Prefix(!isempty(ARGS) ? ARGS[1] : joinpath(@__DIR__,"usr"))
# Instantiate products here.  Examples:
libstemmer = LibraryProduct(prefix, "libstemmer", :libstemmer)
# foo_executable = ExecutableProduct(prefix, "fooifier")
# libfoo_pc = FileProduct(joinpath(libdir(prefix), "pkgconfig", "libfoo.pc"))
# Assign products to `products`:
products = [libstemmer]
# Download binaries from hosted location
bin_prefix = "https://github.com/aviks/SnowballBuilder/releases/download/v0.1.0"
# Listing of files generated by BinaryBuilder:
download_info = Dict(
    BinaryProvider.Linux(:aarch64, :glibc) => ("$bin_prefix/LibStemmer.aarch64-linux-gnu.tar.gz", "9fc5727ee09ea42a9ea0234f3cb87973da06801c51d61a03340fc09d52bb9a9f"),
    BinaryProvider.Linux(:armv7l, :glibc) => ("$bin_prefix/LibStemmer.arm-linux-gnueabihf.tar.gz", "6741ccb3e07c1f0a437a681860bea4280cd26e45360456a594202b4af1e2525c"),
    BinaryProvider.Linux(:i686, :glibc) => ("$bin_prefix/LibStemmer.i686-linux-gnu.tar.gz", "635dfd5016439798d4ce8b6b816329fa27f61aedc29d146e6c27bed9686f9fa7"),
    BinaryProvider.Windows(:i686) => ("$bin_prefix/LibStemmer.i686-w64-mingw32.tar.gz", "c3818e8971124436afc588c3dbf93d42d5ebc23f6abd81e7c3fd3bc9a2531e39"),
    BinaryProvider.Linux(:powerpc64le, :glibc) => ("$bin_prefix/LibStemmer.powerpc64le-linux-gnu.tar.gz", "c44a22f4dad364b954ea0906f4de65ed3e32433facb7621c20be4c52f71ff510"),
    BinaryProvider.MacOS() => ("$bin_prefix/LibStemmer.x86_64-apple-darwin14.tar.gz", "991f333ee1c4cc1e87a07cd76028de1604181e0b5b20f71d0d460aab1f20424d"),
    BinaryProvider.Linux(:x86_64, :glibc) => ("$bin_prefix/LibStemmer.x86_64-linux-gnu.tar.gz", "9daf7ca5f2df44f8208c719dae99e6d52f42285e96a64140a0814b188704dcdc"),
    BinaryProvider.Windows(:x86_64) => ("$bin_prefix/LibStemmer.x86_64-w64-mingw32.tar.gz", "3fa2aeb67cfd8cd62ad67543d2cdbdd362e0bcaf804e33a1d90e0e4c983f7d6a"),
)
if platform_key() in keys(download_info)
    # First, check to see if we're all satisfied
    if any(!satisfied(p; verbose=true) for p in products)
        # Download and install binaries
        url, tarball_hash = download_info[platform_key()]
        install(url, tarball_hash; prefix=prefix, force=true, verbose=true)
    end
    # Finally, write out a deps.jl file that will contain mappings for each
    # named product here: (there will be a "libfoo" variable and a "fooifier"
    # variable, etc...)
    write_deps_file(joinpath(@__DIR__, "deps.jl"), products)
else
    error("Your platform $(Sys.MACHINE) is not supported by this package!")
end