task :default => :build

desc 'Build the site into _site/ (node site/build.mjs)'
task :build do
  sh 'node site/build.mjs'
end

desc 'Build, then serve _site/ at http://localhost:8000'
task :serve => :build do
  Dir.chdir('_site') { sh 'python3 -m http.server 8000' }
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
