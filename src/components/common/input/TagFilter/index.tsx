import React, { useState } from "react";
import { Chip, Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

interface Props {
  items: string[];
  onFilterChange?: (selectedFilters: string[]) => void;
}

const useStyle = makeStyles({
  rootPaper: {
    paddingTop: 10,
    paddingLeft: 10,
    marginTop: 25,
    marginRight: 25,
    float: "right",
    borderRadius: 50,
  },
  rootChip: {
    marginRight: 10,
    marginBottom: 10,
    float: "right",
  },
});

const TagFilter = ({ items, onFilterChange }: Props) => {
  const classes = useStyle();
  const [selectedFilters, setSelectedFilters] = useState(Array());

  React.useEffect(() => {
    if (onFilterChange) {
      onFilterChange(selectedFilters);
    }
  }, [selectedFilters]);

  const onFilterClick = (item: string) => {
    const isFilterSelected = selectedFilters.includes(item);

    !isFilterSelected
      ? setSelectedFilters([...selectedFilters, item])
      : setSelectedFilters(
          selectedFilters.filter((filter) => {
            return filter !== item;
          })
        );
  };

  return (
    <Paper elevation={2} classes={{ root: classes.rootPaper }}>
      {items.map((item) => {
        const isItemSelected = selectedFilters.includes(item);
        return (
          <Chip
            key={item}
            size={"small"}
            label={item}
            onClick={() => onFilterClick(item)}
            color={"primary"}
            variant={isItemSelected ? "default" : "outlined"}
            classes={{
              root: classes.rootChip,
            }}
          />
        );
      })}
    </Paper>
  );
};

export default TagFilter;
