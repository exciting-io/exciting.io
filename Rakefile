task :default => :build

task :build do
  system("jekyll build")
end

task :deploy => :build do
  system("rsync -avz --delete _site/ exciting.io:exciting.io")
  Rake::Task[:fix_permissions].invoke
end

task :fix_permissions do
  system("ssh exciting.io 'chmod og+r -R exciting.io'")
end
