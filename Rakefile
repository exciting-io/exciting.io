task :default => :build

desc 'Build the site from source'
task :build do
  system("jekyll build")
end

desc 'Deploy the site to the exciting.io server'
task :deploy => :build do
  system("rsync -avz --delete _site/ exciting.io:exciting.io")
  Rake::Task[:fix_permissions].invoke
end

desc 'Ensure that the deployed files have the right permissions'
task :fix_permissions do
  system("ssh exciting.io 'chmod og+r -R exciting.io'")
end
