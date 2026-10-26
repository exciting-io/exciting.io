task :default => :build

desc 'Build the site into _site/ (node site/build.mjs)'
task :build do
  sh 'node site/build.mjs'
end

desc 'Build, then serve _site/ at http://localhost:8000'
task :serve => :build do
  Dir.chdir('_site') { sh 'python3 -m http.server 8000' }
end
