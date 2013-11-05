task :deploy do
  system("jekyll build && rsync -avz --delete _site/ exciting.io:exciting.io")
end
